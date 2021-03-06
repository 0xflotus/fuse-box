import { createStylesheetProps } from '../../config/createStylesheetProps';
import { Context } from '../../core/Context';
import { Module } from '../../core/Module';
import { lessHandler } from '../../stylesheet/less/lessHandler';
import { IPluginCommon } from '../interfaces';
import { parsePluginOptions } from '../pluginUtils';
import { cssContextHandler } from './shared';

export function pluginLessCapture(props: { ctx: Context; module: Module; opts: IPluginCommon }) {
  const { ctx, module, opts } = props;
  if (!ctx.isInstalled('less')) {
    ctx.fatal(`Fatal error when capturing ${module.props.absPath}`, [
      'Module "less" is required, Please install it using the following command',
      'npm install less --save-dev',
    ]);
    return;
  }

  ctx.log.info('less', module.props.absPath);

  props.module.read();
  props.module.captured = true;

  const postCSS = lessHandler({ ctx: ctx, module, options: opts.stylesheet });
  if (!postCSS) return;

  // A shared handler that takes care of development/production render
  // as well as setting according flags
  // It also accepts extra properties (like asText) to handle text rendering
  cssContextHandler({
    ctx,
    module: module,
    options: opts.stylesheet,
    processor: postCSS,
    shared: opts,
  });
}

export function pluginLess(a?: IPluginCommon | string | RegExp, b?: IPluginCommon) {
  return (ctx: Context) => {
    let [opts, matcher] = parsePluginOptions<IPluginCommon>(a, b, {});

    opts.stylesheet = createStylesheetProps({ ctx, stylesheet: opts.stylesheet || {} });

    ctx.ict.on('bundle_resolve_module', props => {
      const { module } = props;
      if (props.module.captured || !matcher) {
        return;
      }

      if (matcher.test(module.props.absPath)) {
        pluginLessCapture({ ctx, module, opts: opts });
      }
      return props;
    });
  };
}
