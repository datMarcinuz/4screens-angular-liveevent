# 4screens-angular-liveevent
Live event extension for 4screens angular client for engage form

## How to run
* npm i
* tsd reinstall --save --overwrite

## How to make a release

* gulp release // just do a release
* gulp release --bump // releases and bumps by patch.
* gulp release --bump --increment="__TYPE__" // releases and bumps by __TYPE__ (major, minor and patch by default).


###
Alternative approach to make a release:

1. npm i 
2. gulp minify
3. copy liveevent.js liveevent.js.map liveevent.min.js liveevent.min.js.map to ./build directory (create directory if needed)
4. commit code changes into 'master' branch
5. change to 'release' branch 
6. copy files from ./build directory into project root directory
7. commit changes into 'release' branch
8. tag with next version number
9. push changes into 'master' and 'release' branch with --tags switch
 
