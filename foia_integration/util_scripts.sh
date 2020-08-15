compile() {
    for scss_file in $(find precompiles/scss/ -regex "precompiles\/scss\/[^\/]+\.scss")
    do
        sass $scss_file static/css/$(basename $scss_file .scss).css --style=compressed
    done

    for js_file in $(find precompiles/js/ -regex "precompiles\/js\/[^\/]+\.js")
    do
        browserify $js_file -o static/js/$(basename $js_file) 
    done
}

"$@"