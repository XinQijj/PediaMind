# PediaMind 项目主页

课程项目「儿科基座大模型与多智能体协同诊疗」的展示页（GitHub Pages 静态网页）。

- `index.html`：主页面，所有图表在浏览器里由 `assets/charts.js` 用 SVG 画出；
- `assets/data.js`：页面上的全部评测数字，由主项目的 `scripts/build_project_page_data.py` 从评测结果文件直接生成；
- `assets/video/`：演示视频（网站实录，演示账号中的家庭均为虚构）；
- `assets/img/`：网站截图。

本地预览：`python -m http.server 8090`，然后打开 http://127.0.0.1:8090 。
