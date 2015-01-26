module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    clean:
      default:
        src: ['lib']
        
    coffee:
      compile:
        options:
          bare: true
          join: false
        files: [
          expand: true
          cwd: 'src'
          src: '**/*.coffee'
          dest: 'lib'
          ext: '.js'
        ]

    codo:
      dist:
        src: 'src/**/*.coffee'
        dest: 'docs'
        options:
          name: 'AtomicRecord'
          closure: true
          analytics: 'UA-40562957-12'
          undocumented: false
          private: false
          stats: true
          extra: [ 'LICENSE' ]
          # theme: 'yaml'
          verbose: true

  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-coffee')
  # grunt.loadNpmTasks('grunt-codo')
  grunt.registerTask('default', ['clean', 'coffee',]) # 'codo'])
