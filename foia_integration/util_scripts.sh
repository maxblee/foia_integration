compile() {
    for scss_file in $(find precompiles/scss/ -regex "precompiles\/scss\/[^\/]+\.scss")
    do
        echo $scss_file
        sass $scss_file static/css/$(basename $scss_file .scss).css --style=compressed
    done
    ls precompiles/svelte/ | xargs -I {} npm --prefix precompiles/svelte/{}/ run build
}

test() {
    black .
    pytest
    ls precompiles/svelte/ | xargs -I {} npm --prefix precompiles/svelte/{}/ run format
    ls precompiles/svelte/ | xargs -I {} npm --prefix precompiles/svelte/{}/ run fix
    ls precompiles/svelte | xargs -I {} npm --prefix precompiles/svelte/{}/ run test
}

"$@"