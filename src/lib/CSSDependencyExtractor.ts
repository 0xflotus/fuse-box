import * as path from "path";
import * as fs from "fs";

export interface ICSSDependencyExtractorOptions {
    paths: string[];
    extensions: string[],
    content: string;
    importer?: { (f: string, prev: any, done: { (info: { file: string }): void }): string }
}

export class CSSDependencyExtractor {
    private dependencies: string[] = [];
    constructor(public opts: ICSSDependencyExtractorOptions) {
        this.extractDepsFromString(opts.content);
    }


    private extractDepsFromString(input: string) {
        const re = /@import\s+("|')([^"']+)/g;
        let match;
        while (match = re.exec(input)) {
            let target = this.findTarget(match[2]);
            if (target) {
                this.readFile(target);
                this.dependencies.push(target);
            }
        }
    }

    private readFile(fileName: string) {
        let contents = fs.readFileSync(fileName).toString();
        this.extractDepsFromString(contents)
    }
    public getDependencies() {
        return this.dependencies;
    }

    private tryFile(filePath: string): boolean {
        // restrict node_module
        // we don't want to detect stuff from there
        if (filePath.indexOf("node_modules") > -1) {
            return false;
        }
        if (fs.existsSync(filePath)) {
            return true;
        }
        return false;
    }

    private getPath(suggested: string, fileName: string) {
        let target = fileName;
        if (this.opts.importer) {
            fileName = this.opts.importer(fileName, null, info => {
                target = info.file;
            });
        }
        if (path.isAbsolute(target)) {
            return target;
        }
        return path.join(suggested, target);

    }
    private findTarget(fileName: string): string {
        let targetFile: any;
        let extName = path.extname(fileName);
        if (!extName) {
            for (let p = 0; p < this.opts.paths.length; p++) {
                for (let e = 0; e < this.opts.extensions.length; e++) {
                    let filePath = this.getPath(this.opts.paths[p], fileName + "." + this.opts.extensions[e]);
                    if (this.tryFile(filePath)) {
                        return filePath;
                    }
                }
            }
        } else {
            for (let p = 0; p < this.opts.paths.length; p++) {
                let filePath = this.getPath(this.opts.paths[p], fileName);
                if (this.tryFile(filePath)) {
                    return filePath;
                }

            }
        }
        return targetFile;
    }
    public static init(opts: ICSSDependencyExtractorOptions) {
        return new CSSDependencyExtractor(opts);
    }
    //
}