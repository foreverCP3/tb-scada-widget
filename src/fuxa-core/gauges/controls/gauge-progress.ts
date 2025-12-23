/**
 * V5: GaugeProgress 图元 - 进度条
 */

import { GaugeBaseComponent } from '../gauge-base';
import {
    GaugeSettings,
    Variable,
    GaugeStatus,
    GaugeProperty,
    GaugeRangeProperty,
    GaugeDialogType
} from '../../models/hmi';
import { Utils } from '../../helpers/utils';

export class GaugeProgressComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-gauge_progress';
    static LabelTag = 'HtmlProgress';
    static prefixA = 'A-GXP_';  // 背景区域
    static prefixB = 'B-GXP_';  // 进度条
    static prefixH = 'H-GXP_';  // 水平
    static prefixMax = 'M-GXP_'; // 最大值标签
    static prefixMin = 'm-GXP_'; // 最小值标签
    static prefixValue = 'V-GXP_'; // 值标签
    static barColor = '#3F4964';

    constructor() {
        super();
    }

    static getSignals(pro: any): string[] {
        let res: string[] = [];
        if (pro.variableId) {
            res.push(pro.variableId);
        }
        return res;
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.Range;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
        try {
            if (svgele.node?.children?.length >= 2) {
                let value = parseFloat(sig.value);
                
                // 计算最小最大值
                const min = ga.property?.ranges?.reduce((lastMin: GaugeRangeProperty, item: GaugeRangeProperty) => 
                    item.min < lastMin.min ? item : lastMin,
                    ga.property?.ranges?.length ? ga.property.ranges[0] : undefined
                )?.min ?? 0;
                
                const max = ga.property?.ranges?.reduce((lastMax: GaugeRangeProperty, item: GaugeRangeProperty) => 
                    item.max > lastMax.max ? item : lastMax,
                    ga.property?.ranges?.length ? ga.property.ranges[0] : undefined
                )?.max ?? 100;

                // 找到当前值所在的范围
                const gap = ga.property?.ranges?.find((item: GaugeRangeProperty) => 
                    value >= item.min && value <= item.max
                ) as GaugeRangeProperty;

                let rectBase = Utils.searchTreeStartWith(svgele.node, this.prefixA);
                let rect = Utils.searchTreeStartWith(svgele.node, this.prefixB);

                if (rectBase && rect) {
                    let heightBase = parseFloat(rectBase.getAttribute('height'));
                    let yBase = parseFloat(rectBase.getAttribute('y'));

                    // 限制值范围
                    if (value > max) value = max;
                    if (value < min) value = min;

                    // 计算进度条高度
                    let k = (heightBase - 0) / (max - min);
                    let vtoy = gap ? k * (value - min) : 0;

                    if (!Number.isNaN(vtoy)) {
                        rect.setAttribute('y', yBase + heightBase - vtoy);
                        rect.setAttribute('height', vtoy);

                        // 设置颜色
                        if (gap?.color) {
                            rect.setAttribute('fill', gap.color);
                        }
                        if (gap?.stroke) {
                            rect.setAttribute('stroke', gap.stroke);
                        }

                        // 更新值标签
                        if (gap?.text) {
                            let htmlValue = Utils.searchTreeStartWith(svgele.node, this.prefixValue);
                            if (htmlValue) {
                                htmlValue.innerHTML = value.toString();
                                if (gap.text) {
                                    htmlValue.innerHTML += ' ' + gap.text;
                                }
                                htmlValue.style.top = (heightBase - vtoy - 7).toString() + 'px';
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    static initElement(ga: GaugeSettings, isview: boolean = false): HTMLElement {
        let ele = document.getElementById(ga.id);
        if (ele) {
            ele.setAttribute('data-name', ga.name);

            // 初始化默认属性
            if (!ga.property) {
                ga.property = new GaugeProperty();
                let ip = new GaugeRangeProperty();
                ip.min = 0;
                ip.max = 100;
                ip.style = [true, true];
                ip.color = this.barColor;
                ga.property.ranges = [ip];
            }

            if (ga.property.ranges?.length > 0) {
                let gap = ga.property.ranges[0];

                // 设置最小值标签
                let htmlLabel = Utils.searchTreeStartWith(ele, this.prefixMin);
                if (htmlLabel) {
                    htmlLabel.innerHTML = gap.min.toString();
                    htmlLabel.style.display = gap.style?.[0] ? 'block' : 'none';
                }

                // 设置最大值标签
                htmlLabel = Utils.searchTreeStartWith(ele, this.prefixMax);
                if (htmlLabel) {
                    htmlLabel.innerHTML = gap.max.toString();
                    htmlLabel.style.display = gap.style?.[0] ? 'block' : 'none';
                }

                // 设置值标签
                let htmlValue = Utils.searchTreeStartWith(ele, this.prefixValue);
                if (htmlValue) {
                    htmlValue.style.display = gap.style?.[1] ? 'block' : 'none';
                }

                // 设置进度条颜色
                let rect = Utils.searchTreeStartWith(ele, this.prefixB);
                if (rect) {
                    rect.setAttribute('fill', gap.color);
                }
            }
        }
        return ele!;
    }

    static initElementColor(bkcolor: string, color: string, ele: HTMLElement) {
        let rectArea = Utils.searchTreeStartWith(ele, this.prefixA);
        if (rectArea) {
            if (bkcolor) {
                rectArea.setAttribute('fill', bkcolor);
            }
            if (color) {
                rectArea.setAttribute('stroke', color);
            }
        }
        rectArea = Utils.searchTreeStartWith(ele, this.prefixB);
        if (rectArea) {
            if (color) {
                rectArea.setAttribute('stroke', color);
            }
        }
    }

    static getFillColor(ele: HTMLElement): string {
        let rectArea = Utils.searchTreeStartWith(ele, this.prefixA);
        if (rectArea) {
            return rectArea.getAttribute('fill');
        }
        return '';
    }

    static getStrokeColor(ele: HTMLElement): string {
        let rectArea = Utils.searchTreeStartWith(ele, this.prefixA);
        if (rectArea) {
            return rectArea.getAttribute('stroke');
        }
        return '';
    }

    static getDefaultValue() {
        return { color: this.barColor };
    }
}
