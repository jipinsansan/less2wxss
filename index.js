var path = require('path');
var exec = require('child_process').exec
var cssco = require('csso');
var fTools = require('filetools');

var defConf = {
	"encode": "utf-8",
	"ignore": 'combo',
	"input":  "css",
	"lessInput": "other/less"
}
/**
 * css 解析
 * @param rawCode
 * @returns {*}
 */
function cssParse(rawCode){
	try{
		var code = cssco.justDoIt(rawCode, false);
		return code;
	} catch (err){
		throw new Error('压缩css时发生错误： ' + rawCode);
		return rawCode;
	}
}
/**
 * 单个css文件解析
 * @param cssfile
 */
var oneCssBuild = exports.oneCssBuild = function(cssfile){
	var code = fTools.readFile(cssfile, defConf.encode);
	var cssCode = cssParse(code);
	cssCode = cssCode.replace('font-weight:400', 'font-weight:normal');
	fTools.writeFile(cssfile, cssCode, defConf.encode);
}
//设置lessc路径
var lessc = path.resolve(__dirname+'/node_modules/.bin/lessc.cmd');
/**
 * less文件编译
 * @param filename
 */
var lessCount;
var lessCompire = function(filename, fn) {
	var dir = fTools.getParentDir(filename)
	var lessDir = defConf.workspace + defConf.input + '/' + dir;

	var baseName = path.resolve(lessDir, path.basename(filename, '.less')) + '.wxss';

	//运行lessc命令
	exec('' + lessc + ' ' + filename + ' ' + baseName, { encoding: defConf.encode},
		function (err, stdout, stderr) {
			if (err != null) {
				throw new Error(err);
			}
			oneCssBuild(baseName);
			lessCount--;
			console.log('剩余：' +lessCount);
			if(!lessCount){
				fn && fn();
			}
		}
	);
};

function lessBuild(fn){
	var lessPath = defConf.workspace + defConf.lessInput;
	function build(files){
		lessCount = files.length;
		files.forEach(function(file){
			lessCompire(file, fn);
		});
	}
	fTools.walk(lessPath, build);
}

var TIMES;
/**
 * 计时
 */
function onStart(){
	TIMES = +new Date;
	console.log('>>Start build');
}

function onEnd(){
	var timeUse = +new Date - TIMES;
	console.log('>>All done: Time use:', timeUse/1000, '秒');
	console.log('完成时间:', Date());
}
/**
 * 多个 css 构建
 */

exports.AllCssBuild = function(){
	var cssPath = defConf.workspace + defConf.input;
	function build(files){
		files.forEach(function(file){
			if(fTools.isDirIgnore(file, defConf.encode)) return;
			oneCssBuild(file);
		});
	}
	fTools.walk(cssPath, build);
}
/**
 * 开始执行
 */
exports.less2css = function(conf){
	defConf = fTools.mix(defConf, conf);
	onStart();
	lessBuild(onEnd);
}