
const mammoth = require("mammoth");
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 删除文件
const del = require('del');

// 样式
const chalk = require('chalk');
const suceessTip = function(msg) {
  console.log(chalk.green('*') + ' ' + msg);
};

// 根据文档内容创建html页面
const createHtml = function (document, fileName, fileRemote, config) {
  const htmlTitle = config.title;
  let newFileDir = path.resolve(config.dist, './' + fileRemote); // 兼容性写好，同时接收用户输入的'D:/test'和'D:/test/'格式
  fs.exists(newFileDir, function(exists) {
    if (!exists) {
      fs.mkdir(newFileDir, function(){
        // console.log(JSON.stringify(err));
      });
    }
  })
  let filePath = path.resolve(newFileDir, fileName + '.html');
  filePath = filePath.replace(/\\/g, '/');

  const htmlTemplatePath = config.template ? config.template : path.resolve(__dirname, 'template', 'common.html');

  fs.readFile(htmlTemplatePath, 'utf8', function(err, htmlTemplate){

    let newDocument = htmlTemplate.replace(/#bodyDocument/g, document)
      .replace(/#documentTitle/g, htmlTitle);

    fs.writeFile(filePath, newDocument, (err) => {
      if (err) {
        throw Error(err);
      }
      suceessTip('成功生成'+ filePath);
    });

  })
};

const convert = function (configs) {
  if (configs.local) {
    if (configs.local.indexOf('.docx') >= 0) { // 判断local是否是单个word文件
      const one = path.parse(configs.local);
      const fileName = one.name;
      mammoth.convertToHtml({path: configs.local })
        .then(function(result){
          const htmlDocument = result.value;
          // fileRemote直接设置为''，表示直接放在dist目录中
          createHtml(htmlDocument, fileName, '', configs);
        })
        .done();
    } else {
      const wordFiles = glob.sync(path.resolve(configs.local, '**/*.docx'));
      if (wordFiles.length == 0) {
        console.log(chalk.yellow('warn: ' + configs.local + '中没有找到word文档。'));
      }
      wordFiles.forEach(item => {
        const one = path.parse(item);
        const fileDir = one.dir;
        let fileRemote;
        if (configs.local.replace(fileDir, '') == '/' ||
          fileDir.replace(configs.local, '') == '/') {
          fileRemote = '';
        } else {
          fileRemote = fileDir.replace(configs.local, '');
        }
        const fileName = one.name;
        mammoth.convertToHtml({path: item })
          .then(function(result){
            var htmlDocument = result.value;
            createHtml(htmlDocument, fileName, fileRemote, configs);
          })
          .done();
      });
    }
  }
};

module.exports = function (configs) {

  // pc 斜杆处理
  configs.local = configs.local.replace(/\\/g, '/');
  configs.dist = configs.dist.replace(/\\/g, '/');
  configs.template = configs.template.replace(/\\/g, '/');

  const htmlDir = configs.dist;
  fs.exists(htmlDir, function(exist) {
    if (!exist) {
      fs.mkdir(htmlDir, function(){
        convert(configs);
      });
    } else if (exist) {
      convert(configs);
    }
  })
}
