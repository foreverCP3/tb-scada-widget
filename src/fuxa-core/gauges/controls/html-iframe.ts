/**
 * HTML Iframe Component - Migrated from FUXA
 * Embeds external content via iframe
 */

import { GaugeBaseComponent, IGauge } from '../gauge-base';
import { GaugeSettings, GaugeProperty, Variable, GaugeStatus, GaugeDialogType } from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export class HtmlIframeComponent extends GaugeBaseComponent implements IGauge {
  static TypeTag = 'svg-ext-own_ctrl-iframe';
  static LabelTag = 'HtmlIframe';
  static PREFIX = 'D-OXC_';

  /**
   * Get signals from gauge property
   */
  static getSignals(pro: GaugeProperty): string[] {
    const res: string[] = [];
    if (pro.variableId) {
      res.push(pro.variableId);
    }
    return res;
  }

  static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Iframe;
  }

  /**
   * Process value update for iframe element
   */
  static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus, iframeElement?: HTMLIFrameElement): HTMLIFrameElement | undefined {
    try {
      if (ga.property) {
        // Update iframe source from variable
        if (ga.property.variableId === sig.id && iframeElement) {
          const value = sig.value;
          if (value && typeof value === 'string' && Utils.isValidUrl(value)) {
            if (iframeElement.src !== value) {
              iframeElement.src = value;
            }
          }
        }
      }
      return iframeElement;
    } catch (err) {
      console.error('HtmlIframeComponent.processValue error:', err);
      return iframeElement;
    }
  }

  /**
   * Initialize iframe element
   */
  static initElement(ga: GaugeSettings, isView: boolean = true): HTMLIFrameElement | null {
    const ele = document.getElementById(ga.id);
    if (!ele) return null;

    ele.setAttribute('data-name', ga.name);

    const htmlIframe = Utils.searchTreeStartWith(ele, this.PREFIX);
    if (!htmlIframe) return null;

    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');

    // Apply property settings
    if (ga.property) {
      // Set initial source
      if (ga.property.address && Utils.isValidUrl(ga.property.address)) {
        iframe.src = ga.property.address;
      }

      // Apply sandbox restrictions if specified
      if (ga.property.options?.sandbox) {
        iframe.setAttribute('sandbox', ga.property.options.sandbox);
      }

      // Allow features
      if (ga.property.options?.allow) {
        iframe.setAttribute('allow', ga.property.options.allow);
      }

      // Referrer policy
      if (ga.property.options?.referrerPolicy) {
        iframe.setAttribute('referrerpolicy', ga.property.options.referrerPolicy);
      }
    }

    // Clear container and append iframe
    htmlIframe.innerHTML = '';
    htmlIframe.appendChild(iframe);

    return iframe;
  }

  /**
   * Detect changes and reinitialize element
   */
  static detectChange(ga: GaugeSettings): HTMLIFrameElement | null {
    return HtmlIframeComponent.initElement(ga, false);
  }

  /**
   * Resize iframe element
   */
  static resize(ga: GaugeSettings): void {
    // Iframe auto-resizes with CSS
  }
}
