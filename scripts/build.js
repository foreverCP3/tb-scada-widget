/**
 * 构建脚本
 * 将 Widget 代码打包成 TB 可导入的 JSON Bundle
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const widgetsDir = path.resolve(rootDir, 'src/widgets');

// 确保 dist 目录存在
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

/**
 * 读取文件内容
 */
function readFile(filePath) {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

/**
 * 构建单个 Widget
 */
function buildWidget(widgetName) {
  const widgetDir = path.join(widgetsDir, widgetName);
  
  if (!fs.existsSync(widgetDir)) {
    console.log(`Widget 目录不存在: ${widgetName}`);
    return null;
  }

  const html = readFile(path.join(widgetDir, 'template.html'));
  const css = readFile(path.join(widgetDir, 'style.css'));
  const js = readFile(path.join(widgetDir, 'controller.js'));
  const settingsPath = path.join(widgetDir, 'settings.json');
  const settings = fs.existsSync(settingsPath) 
    ? JSON.parse(readFile(settingsPath)) 
    : {};

  if (!html && !js) {
    console.log(`Widget 没有内容: ${widgetName}`);
    return null;
  }

  return {
    name: settings.name || widgetName,
    type: settings.type || 'latest',
    sizeX: settings.sizeX || 8,
    sizeY: settings.sizeY || 6,
    resources: settings.resources || [],
    templateHtml: html,
    templateCss: css,
    controllerScript: js,
    settingsSchema: JSON.stringify(settings.settingsSchema || {}),
    dataKeySettingsSchema: JSON.stringify(settings.dataKeySettingsSchema || {}),
    defaultConfig: JSON.stringify(settings.defaultConfig || {})
  };
}

/**
 * 主构建流程
 */
function build() {
  console.log('开始构建 TB Widget Bundle...\n');

  // 获取所有 widget 目录
  const widgets = fs.readdirSync(widgetsDir)
    .filter(name => {
      const stat = fs.statSync(path.join(widgetsDir, name));
      return stat.isDirectory() && !name.startsWith('.');
    });

  const widgetTypes = [];

  for (const widgetName of widgets) {
    console.log(`构建 Widget: ${widgetName}`);
    const widget = buildWidget(widgetName);
    if (widget) {
      widgetTypes.push(widget);
      console.log(`  ✓ ${widget.name}`);
    }
  }

  if (widgetTypes.length === 0) {
    console.log('\n没有可构建的 Widget');
    return;
  }

  // 生成 Bundle JSON
  const bundle = {
    widgetsBundle: {
      title: 'TB Industrial Widgets',
      alias: 'tb_industrial_widgets',
      description: '基于 FUXA 的工业组态 Widget'
    },
    widgetTypes
  };

  const outputPath = path.join(distDir, 'tb-industrial-widgets-bundle.json');
  fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 2));

  console.log(`\n✓ 构建完成: ${outputPath}`);
  console.log(`  包含 ${widgetTypes.length} 个 Widget`);
}

build();
