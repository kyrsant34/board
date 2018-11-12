//Подключаем библиотеки
var gulp            = require('gulp'), // Подключаем Gulp
    extender        = require('gulp-html-extend'), //Подключаем html Extend
    sass            = require('gulp-sass'), //Подключаем Sass пакет
    //autoprefixer    = require('gulp-autoprefixer'),// Подключаем библиотеку для автоматического добавления префиксов
    browserSync     = require('browser-sync'), // Подключаем Browser Sync - Автоматическое обновление страниц по сохранению файлов
    concat          = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
    uglifyes        = require('uglify-es'), // Подключаем gulp-uglifyjs (для сжатия JS es6)
    composer        = require('gulp-uglify/composer'),
    uglify          = composer(uglifyes, console),
    //uglify          = require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
    cssnano         = require('gulp-cssnano'), // Подключаем пакет для минификации CSS
    rename          = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
    del             = require('del'), // Подключаем библиотеку для удаления файлов и папок
    imagemin        = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
    pngquant        = require('imagemin-pngquant'); // Подключаем библиотеку для работы с png
    spritesmith     = require('gulp.spritesmith'); // Подключаем библиотеку для сборки sprite из картинок
    reload          = browserSync.reload;

//Поддерживаемые браузеры
var supported = [
    'last 15 versions',
    'safari >= 8',
    'ie >= 10',
    'ff >= 20',
    'ios 6',
    'android 4'
];

var buildpath       = "../static/info/build"; //Путь к build в apps
var buildpathbuild  = "../../../public/static/info/build"; //Путь к build на public

gulp.task('browser-sync', function() { // Создаем таск browser-sync (Автоматическое обновление страниц по сохранению файлов)
    browserSync({ // Выполняем browser Sync
        server: { // Определяем параметры сервера
            baseDir: 'src' // Директория для сервера - src
        },
        notify: false // Отключаем уведомления
    });
});


// Инклуды (включения) в html-верстку
gulp.task('html-extend', function () {
    return gulp.src('src/template/*.html')   // Берем все html файлы из папки template (из корня)
        .pipe(extender({annotations:true, verbose:false})) // Собираем html-файлы
        .pipe(gulp.dest('src'))  //выгружаем в src
        .pipe(reload({stream: true})); // Перезагружаем страницу
});


gulp.task('scss', function() { // Создаем таск scss
    return gulp.src('src/scss/**/*.scss') // Берем все sass файлы из папки sass и дочерних, если таковые будут
        .pipe(sass()) // Преобразуем Sass в CSS посредством gulp-sass
        //.pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: false })) // Создаем префиксы
        //.pipe(cssnano()) // Сжимаем
        .pipe(cssnano({
            autoprefixer: {browsers: supported, add: true}
        }))
        .pipe(rename({suffix: '.min'})) // Добавляем суффикс .min
        .pipe(gulp.dest('src/css')) // Выгружаем результат в папку src/css
        .pipe(reload({stream: true})); // Перезагружаем страницу
});


//Сжатие стилей библиотек
gulp.task('css-libs', ['scss'], function() {
    return gulp.src('src/css/libs.css') // Выбираем файл для минификации
        .pipe(cssnano()) // Сжимаем
        .pipe(rename({suffix: '.min'})) // Добавляем суффикс .min
        .pipe(gulp.dest('src/css')); // Выгружаем в папку src/css
});


//Сборка и сжатие всех библиотек (перед watch)
gulp.task('scripts', function() {
    return gulp.src([ // Берем все необходимые библиотеки
        'node_modules/jquery/dist/jquery.min.js', // Берем jQuery
        'node_modules/jquery-ui-dist/jquery-ui.min.js' // jquery-ui
        ])
        .pipe(concat('libs.min.js')) // Собираем их в кучу в новом файле libs.min.js
        .pipe(uglify()) // Сжимаем JS файл
        .pipe(gulp.dest('src/js')) // Выгружаем в папку src/js
        .pipe(reload({stream: true})); // Перезагружаем страницу
});


//Сборка и сжатие всех пользовательских js-файлов
gulp.task('scripts-custom', function() { // Создаем таск scripts-custom
    return gulp.src('src/js/partials/*.js') // Берем все js файлы из папки js/partials
        .pipe(concat('scripts.min.js')) // Собираем их в кучу в новом файле scripts.min.js
        .pipe(uglify()) // Сжимаем JS файл
        .pipe(gulp.dest('src/js')) // Выгружаем результат в папку src/css
        .pipe(reload({stream: true})); // Перезагружаем страницу
});

//Оптимизация изображений
gulp.task('img', function() {
    return gulp.src(['!src/img/sprite/**/*', 'src/img/**/*+(jpg|jpeg|png|gif|svg|JPG|JPEG|PNG|GIF|SVG)']) // Берем все изображения из src
        .pipe(imagemin({ // Сжимаем их с наилучшими настройками
            //optimizationLevel: 3,
            interlaced: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(buildpath+'/img')); // Выгружаем на продакшен
});


//Sprite для иконок @2x
gulp.task('sprite', function() {
    var spriteData = 
        gulp.src('src/img/sprite/*.*') // путь, откуда берем картинки для спрайта
            .pipe(spritesmith({
                retinaSrcFilter: ['src/img/sprite/*@2x.*'],//берем картинки с названием @2x на конце для ретины
                imgName: 'sprite.png',//имя спрайта
                retinaImgName: 'sprite@2x.png',//имя спрайта для ретины
                cssName: '_sprite.scss',
                cssFormat: 'scss',
                algorithm: 'binary-tree',
                cssTemplate: 'scss.template.mustache',
                cssVarMap: function(sprite) {
                    sprite.name = 'SPRITE__' + sprite.name
                }
            }));

    spriteData.img.pipe(gulp.dest('src/img/')); // путь, куда сохраняем картинку
    spriteData.css.pipe(gulp.dest('src/scss/')); // путь, куда сохраняем стили
});



//Очищаем папку build
gulp.task('clean', function() {
    return del.sync(buildpath, {force: true}); // Удаляем папку build перед сборкой (force: true - для удаления папки вне галп-видения)
});

//Очищаем все html
gulp.task('clean-html', function() {
    return del.sync('src/*.html'); // Удаляем все html из корня src
});

//Меняем путь для продакшен
gulp.task('build-prod-path', function() {
    buildpath = buildpathbuild; //Путь к build на public
});


//Cборка в папку build - продакшен
gulp.task('build', ['clean', 'clean-html', 'sprite', 'img', 'css-libs', 'scripts', 'scripts-custom', 'html-extend'], function() {
    var buildCss = gulp.src([ // Переносим CSS стили в продакшен
        'src/css/main.min.css',
        'src/css/libs.min.css'
        ])
    .pipe(gulp.dest(buildpath+'/css'))

    var buildFonts = gulp.src('src/fonts/**/*') // Переносим шрифты в продакшен
    .pipe(gulp.dest(buildpath+'/fonts'))

    var buildJs = gulp.src('src/js/*.js') // Переносим скрипты JS в продакшен
    .pipe(gulp.dest(buildpath+'/js'))

    var buildHtml = gulp.src('src/*.html') // Переносим HTML в продакшен
    .pipe(gulp.dest(buildpath));
});


//СЛЕДИМ
gulp.task('watch', ['browser-sync', 'html-extend', 'sprite', 'css-libs', 'scripts', 'scripts-custom'], function() {
    gulp.watch('src/scss/**/*.scss', ['css-libs']); // Наблюдение за sass файлами в папке scss
    gulp.watch('src/template/**/*.html', ['html-extend']);   // Наблюдение за HTML файлами в папке template
    gulp.watch('src/js/partials/**/*.js', ['scripts-custom']);   // Наблюдение за пользовательскими JS файлами в папке js/partials
    gulp.watch('src/img/sprite/*.*', ['sprite']);   // Наблюдение за IMG файлами в папке img
});

//Cборка в динамически изменяемую папку build (продакшен) со слежением (для локального удобства тестирования)
gulp.task('build-watch', ['build-prod-path','build'], function() {
    gulp.watch('src/scss/**/*.scss', ['build']); // Наблюдение за sass файлами в папке scss
    gulp.watch('src/js/partials/**/*.js', ['build']);   // Наблюдение за пользовательскими JS файлами в папке js/partials
    gulp.watch('src/img/sprite/*.*', ['build']);   // Наблюдение за IMG файлами в папке img
});


gulp.task('default', ['watch']);


//  ИТОГО:
//  gulp - запускает watch-TASK | Отслеживание файлов и сборка в папку src
//  gulp build - запускает build-TASK | Cборка конечного варианта в папку build
//  gulp build-watch - запускает build-watch-TASK | Отслеживание файлов и сборка конечного варианта в папку build (public)