const gulp            = require('gulp'); 
const handlebars      = require('gulp-handlebars');//模版 
const declare         = require('gulp-declare');
const minifyCss       = require('gulp-minify-css');
const revCollector    = require('gulp-rev-collector'); 
const autoprefixer    = require('gulp-autoprefixer'); 
const imagemin        = require('gulp-imagemin');
const spritesmith     = require('gulp.spritesmith');
const watch           = require('gulp-watch');
const transport       = require("gulp-cmd-transit");//获取文件的ID
const defineModule    = require('gulp-define-module');
const revOutdated     = require('gulp-rev-outdated');
const concat          = require('gulp-concat');
const jshint          = require('gulp-jshint');
const uglify          = require('gulp-uglify');
const wrapJS          = require("gulp-wrap-js");
const wrap            = require('gulp-wrap');
const rev             = require('gulp-rev');
const seajsRev        = require('gulp-seajs-rev');//替换seajs map 配置文件
const seajsUser       = require('gulp-seajs-user');//替换seajs 配置文件
const gutil           = require('gulp-util');
const rimraf          = require('rimraf');
const path            = require('path');
const through         = require('through2');
const browserSync     = require('browser-sync');  
//var plumber = require('gulp-plumber');
//var less= require('gulp-less');

/**
 * 图片处理
 */
//图片合并
gulp.task('sprite', function () {
  var spriteData = gulp.src('./img/*.png').pipe(spritesmith({
    imgName: './img/sprite.png',
    cssName: './css/sprite.css'
  }));
  return spriteData.pipe(gulp.dest('./dist/'));
});
//图片压缩
gulp.task('images',['sprite'], function(){
    gulp.src('./dist/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./dist/img/'));
})

//----------------------------------------------------------------------------------------------------------------------------------------------//

/**
 * 模版和json文件处理
 */
//tpl html 等模版转js
gulp.task('templates', function(){
  gulp.src('template/translateOrder.tpl')
    .pipe(handlebars())
    .pipe(concat('translateOrder.tpl.js'))
    .pipe(defineModule('node'))
    .pipe(wrapJS('define(function (require, exports, module) {%= body %})'))
    .pipe(gulp.dest('dist/template/'));
});
//json文件转js文件
gulp.task('json', function(){
  gulp.src('JSON/cityData.json')
    .pipe(concat('cityData.json.js'))
    .pipe(defineModule('node'))
    .pipe(wrapJS('define(function (require, exports, module) {%= body %})'))
    .pipe(gulp.dest('build/json/'));
});

//----------------------------------------------------------------------------------------------------------------------------------------------//

/**
 * 单元测试
 */
//语法检查
gulp.task('jshint', function () {
    return gulp.src('./sea-modules/orderTable/0.1.0/orderTable.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});


//捕获任务中的出错
//gulp.src('./*.ext')
    //.pipe(plumber())
    //.pipe(less())
    //.pipe(gulp.dest('./'));

//----------------------------------------------------------------------------------------------------------------------------------------------//


//css压缩 合并 重命名
gulp.task('concat', function() {                                
    gulp.src(['./static/css/globals.css', './static/css/header.css','./static/css/footer.css','./static/css/index.css'])    //- 需要处理的css文件，放到一个字符串数组里
        .pipe(autoprefixer({//为其补全浏览器兼容的css
            browsers: ['last 2 versions', 'Android >= 4.0'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove:true //是否去掉不必要的前缀 默认：true 
        }))
        .pipe(concat('index.css'))                              //- 合并后的文件名
        .pipe(minifyCss())                                      //- 压缩处理成一行
        .pipe(rev())                                            //- 文件名加MD5后缀
        .pipe(gulp.dest('./dist/css'))                          //- 输出文件本地
        .pipe(rev.manifest())                                   //- 生成一个rev-manifest.json
        .pipe(gulp.dest('./rev'));                              //- 将 rev-manifest.json 保存到 rev 目录内
});
//更改html css引用路径
gulp.task('rev', function() {
    gulp.src(['./rev/*.json', './views/index.html'])   //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe(revCollector({
            replaceReved: true,
            dirReplacements: {
                'css': '../css/'
            }}))                                                //- 执行文件内css名的替换
        .pipe(gulp.dest('./dist/html'));                        //- 替换后的文件输出的目录
});
gulp.task('cssClean',['rev'], function() {
    gulp.src( ['dist/css/*.css'], {read: false})
        .pipe( revOutdated(1) ) // 只保留一个版本的文件 其余文件删除
        .pipe( cleaner() );
    return;
});
//执行文件清除和css压缩重命名
gulp.task('css', function(){
  gulp.run('cssClean');
})

//----------------------------------------------------------------------------------------------------------------------------------------------//

/**
 * js处理
 */
// sea-modules js压缩并替换文件名 
gulp.task('js', function() {
    var config = {
        mangle: {except: ['define', 'require', 'module', 'exports']},
        compress: false
    };
    return gulp.src('./sea-modules/placeholder/0.1.0/placeholder.js')
        .pipe(rev())        
        .pipe(uglify(config))//配置的变量不压缩
        .pipe(gulp.dest('./sea-modules/placeholder/0.1.0'))
        .pipe(rev.manifest())//
        .pipe(seajsRev({base:'dist', configFile:'config/seajs-config-map.js'}))//配置文件名字和路径
});
//sea-modules 清除
gulp.task('clean',['js'], function() {
    gulp.src( ['sea-modules/placeholder/0.1.0/*.js'], {read: false})
        .pipe( revOutdated(1) ) // 只保留一个版本的文件 其余文件删除
        .pipe( cleaner() );
    return;
});
// js-modules js压缩并替换文件名 
gulp.task('jsModules', function() {
    var config = {
        mangle: {except: ['define', 'require', 'module', 'exports']},
        compress: false
    };
    return gulp.src('./static/js-modules/header.js')
        .pipe(rev())        
        .pipe(uglify(config))//配置的变量不压缩
        .pipe(gulp.dest('./dist/js'))
        .pipe(rev.manifest())//
        .pipe(seajsRev({base:'dist', configFile:'config/seajs-config-map.js'}))//配置文件名字和路径
});
//js-modules 清除
gulp.task('cleanModules',['jsModules'], function() {
    gulp.src( ['sea-modules/translate-service/0.1.0/*.js'], {read: false})
        .pipe( revOutdated(1) ) // 只保留一个版本的文件 其余文件删除
        .pipe( cleaner() );
    return;
});
//入口文件js压缩并替换文件名
gulp.task('deJs', function() {
    var config = {
        mangle: {except: ['define', 'require', 'module', 'exports']},
        compress: false
    };
    return gulp.src('./static/js/transformationUpload.js')//压缩要输入对应的文件名
        .pipe(rev())        
        .pipe(uglify(config))//配置的变量不压缩
        .pipe(gulp.dest('./dist/js'))
        .pipe(rev.manifest())
        .pipe(seajsUser({base:'dist', configFile:'config/seajs-config.js'}))//配置文件名字和路径
});
//入口文件 清除
gulp.task('deClean',['deJs'], function() {
    gulp.src( ['dist/js/*.js'], {read: false})
        .pipe( revOutdated(1) ) // 只保留一个版本的文件 其余文件删除
        .pipe( cleaner() );
    return;
});
//清除文件
function cleaner() {
    return through.obj(function(file, enc, cb){
        rimraf( path.resolve( (file.cwd || process.cwd()), file.path), function (err) {
            if (err) {
                this.emit('error', new gutil.PluginError('Cleanup old files', err));
            }
            this.push(file);
            cb();
        }.bind(this));
    });
}

//----------------------------------------------------------------------------------------------------------------------------------------------//

/**
 * 监听文件
 */
//监听任务
gulp.task('watch', function() {
    watch('./template/*', function() {
        gulp.run('templates');
    });

});
//监听文件自动刷新浏览器
gulp.task('browser-sync', function () {
   var files = [
      './views/*.html',
      './static/css/*.css',
      './static/js/*.js'
   ];

   browserSync.init(files, {
      server: {
         baseDir: ''
      }
   });
});

//----------------------------------------------------------------------------------------------------------------------------------------------//
gulp.task('mytest',['rev'],function(){
debugger;
})
