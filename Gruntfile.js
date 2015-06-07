module.exports = function(grunt) {
 
  // configure the tasks
  grunt.initConfig({
 
    copy: {
      build: {
        cwd: 'src',
        src: ['index.html', 'app/**/*.js', 'assets/libs/**', 'assets/fonts/**', 'assets/data/podunksToTimeZones.json' ],
        dest: 'build',
        expand: true
      },
    },  
    clean: {
      build: {
        src: ['build']
      },
      scripts: {
        src: ['build/**/*.js', 'build/app', '!build/app.js', '!build/assets/**']
      },
    },
    cssmin: {
      build: {
        files: {
          'build/assets/css/app.css': ['src/assets/**/*.css']
        }
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
          "build/assets/css/styles.css": "src/assets/less/styles.less"
        }
      }
    },
    uglify: {
      build: {
        files: {
          'build/app.js': ['build/app/**/*.js']
        },
        options: {
          mangle: true
        }
      }
    },
    watch: {
      copy: {
        files: [ 'src/index.html', 'src/app/**/*.js', 'src/assets/libs/**', 'src/assets/data/podunksToTimeZones.json', 'src/assets/fonts/**' ],
        tasks: [ 'copy' ]
      },
      scripts: {
        files: 'src/app/**/*.js',
        tasks: [ 'scripts' ]
      },
      stylesheets: {
        files: [ 'src/assets/css/*.css', 'src/assets/less/*.less' ],
        tasks: [ 'stylesheets' ]
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
    ['less', 'cssmin']
    );

  grunt.registerTask(
    'scripts',
    'Uglifies javascript and compresses.',
    ['uglify', 'clean:scripts']
    );

  grunt.registerTask(
    'build',
    'Compiles all of the assets and copies the files to the build directory.',
    ['clean:build', 'copy', 'stylesheets', 'scripts']
    );

  grunt.registerTask(
    'default', 
    'Watches the project for changes, automatically builds them and runs a server.', 
    [ 'build', 'connect', 'watch' ]
  );
};