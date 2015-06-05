module.exports = function(grunt) {
 
  // configure the tasks
  grunt.initConfig({
 
    copy: {
      build: {
        cwd: 'src',
        src: ['index.html', 'js/libraries/**', 'fonts/**', 'data/podunksToTimeZones.json' ],
        dest: 'build',
        expand: true
      },
    },  
    clean: {
      build: {
        src: ['build']
      },
    },
    cssmin: {
      build: {
        cwd: 'src',
        src: ['**/*.css'],
        dest: 'build',
        expand: true
      }
    },
    less: {
      development: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: {
          "build/css/styles.css": "src/less/styles.less"
        }
      }
    },
    uglify: {
      build: {
        cwd: 'src',
        src: ['*/*.js'],
        dest: 'build',
        expand: true,
        options: {
          mangle: true
        }
      }
    },
    watch: {
      scripts: {
        files: 'src/*/*.js',
        tasks: [ 'scripts' ]
      },
      stylesheets: {
        files: [ 'src/**/*.css', 'src/less/styles.less' ],
        tasks: [ 'stylesheets' ]
      },
      copy: {
        files: [ 'src/index.html', 'src/js/libraries/**', 'src/data/podunksToTimeZones.json', 'src/fonts/**' ],
        tasks: [ 'copy' ]
      }
    },
    connect: {
      server: {
        options: {
          port: 7337,
          base: 'build',
          hostname: '*'
        }
      }
    }
  });
 
  // load the tasks
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // define the tasks
  grunt.registerTask(
    'stylesheets',
    'Minifies CSS and complies/minifies less',
    ['cssmin', 'less']
    );

  grunt.registerTask(
    'scripts',
    'Uglifies javascript and compresses.',
    ['uglify']
    );

  grunt.registerTask(
    'build',
    'Compiles all of the assets and copies the files to the build directory.',
    ['clean', 'copy', 'stylesheets', 'scripts']
    );

  grunt.registerTask(
    'default', 
    'Watches the project for changes, automatically builds them and runs a server.', 
    [ 'build', 'connect', 'watch' ]
  );
};