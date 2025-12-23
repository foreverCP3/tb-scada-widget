/**
 * HTML Video Component - Migrated from FUXA
 * Displays video with playback control actions
 */

import { GaugeBaseComponent, IGauge } from '../gauge-base';
import { GaugeSettings, GaugeProperty, Variable, GaugeStatus, GaugeAction, GaugeDialogType } from '../../models/hmi';
import { Utils } from '../../helpers/utils';

declare var SVG: any;

export class HtmlVideoComponent extends GaugeBaseComponent implements IGauge {
  static TypeTag = 'svg-ext-own_ctrl-video';
  static LabelTag = 'HtmlVideo';
  static PREFIX = 'D-OXC_';

  /**
   * Get signals from gauge property
   */
  static getSignals(pro: GaugeProperty): string[] {
    const res: string[] = [];
    if (pro.variableId) {
      res.push(pro.variableId);
    }
    if (pro.actions) {
      pro.actions.forEach(act => {
        if (act.variableId) {
          res.push(act.variableId);
        }
      });
    }
    return res;
  }

  static getDialogType(): GaugeDialogType {
    return GaugeDialogType.Video;
  }

  /**
   * Process value update for video element
   */
  static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus, videoElement?: HTMLVideoElement): HTMLVideoElement | undefined {
    try {
      if (ga.property) {
        // Update video source from variable
        if (ga.property.variableId === sig.id && videoElement) {
          const value = sig.value;
          if (value && typeof value === 'string') {
            const currentSrc = videoElement.querySelector('source')?.getAttribute('src');
            if (currentSrc !== value) {
              HtmlVideoComponent.setVideoSource(videoElement, value);
            }
          }
        }

        // Process actions
        if (ga.property.actions) {
          ga.property.actions.forEach((act: any) => {
            if (act.variableId === sig.id && videoElement) {
              HtmlVideoComponent.processAction(act, videoElement, sig.value, gaugeStatus);
            }
          });
        }
      }
      return videoElement;
    } catch (err) {
      console.error('HtmlVideoComponent.processValue error:', err);
      return videoElement;
    }
  }

  /**
   * Process video action (play, pause, stop, reset)
   */
  static processAction(act: GaugeAction, videoElement: HTMLVideoElement, value: any, gaugeStatus: GaugeStatus): void {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const actValue = GaugeBaseComponent.checkBitmask(act.bitmask, numValue);

    if (act.range && act.range.min <= actValue && act.range.max >= actValue) {
      switch (act.type) {
        case 'start':
        case 'play':
          videoElement.play().catch(err => console.warn('Video play error:', err));
          break;
        case 'pause':
          videoElement.pause();
          break;
        case 'stop':
          videoElement.pause();
          videoElement.currentTime = 0;
          break;
        case 'reset':
          videoElement.currentTime = 0;
          break;
      }
    }
  }

  /**
   * Initialize video element
   */
  static initElement(ga: GaugeSettings, isView: boolean = true): HTMLVideoElement | null {
    const ele = document.getElementById(ga.id);
    if (!ele) return null;

    ele.setAttribute('data-name', ga.name);

    const htmlVideo = Utils.searchTreeStartWith(ele, this.PREFIX);
    if (!htmlVideo) return null;

    // Create video element
    const video = document.createElement('video');
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    video.controls = true;
    video.autoplay = false;
    video.muted = false;

    // Apply property settings
    if (ga.property) {
      if (ga.property.options) {
        if (ga.property.options.autoplay) {
          video.autoplay = true;
          video.muted = true; // Autoplay requires muted in most browsers
        }
        if (ga.property.options.loop) {
          video.loop = true;
        }
        if (ga.property.options.muted) {
          video.muted = true;
        }
        if (ga.property.options.controls === false) {
          video.controls = false;
        }
      }

      // Set initial source
      if (ga.property.address) {
        HtmlVideoComponent.setVideoSource(video, ga.property.address);
      }

      // Set poster/splash image
      if (ga.property.options?.poster) {
        video.poster = ga.property.options.poster;
      }
    }

    // Clear container and append video
    htmlVideo.innerHTML = '';
    htmlVideo.appendChild(video);

    return video;
  }

  /**
   * Set video source with proper MIME type detection
   */
  static setVideoSource(video: HTMLVideoElement, src: string): void {
    // Clear existing sources
    video.innerHTML = '';

    const source = document.createElement('source');
    source.src = src;
    source.type = HtmlVideoComponent.getMimeTypeFromUrl(src);
    video.appendChild(source);

    // Reload video
    video.load();
  }

  /**
   * Get MIME type from URL
   */
  static getMimeTypeFromUrl(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    const mimeTypes: { [key: string]: string } = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'ogv': 'video/ogg',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'm3u8': 'application/x-mpegURL',
      'ts': 'video/MP2T'
    };
    return mimeTypes[ext || ''] || 'video/mp4';
  }

  /**
   * Detect changes and reinitialize element
   */
  static detectChange(ga: GaugeSettings): HTMLVideoElement | null {
    return HtmlVideoComponent.initElement(ga, false);
  }

  /**
   * Resize video element
   */
  static resize(ga: GaugeSettings): void {
    // Video element auto-resizes with CSS
  }
}
