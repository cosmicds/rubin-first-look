#!/bin/bash

# TODO(?): Make a PowerShell version of this

# The idea for this comes from https://unix.stackexchange.com/a/196246
# I've modified it to remove hyphens as well
function to_pascal_case {
    echo $1 | perl -pe 's/(^|(_|-))./uc($&)/ge;s/_|-//g'
}

function space_split_pascal {
    echo $1 | perl -pe 's/(?<!^)([A-Z]+)/ $1/g'
}

if [[ $# -lt 1 ]]; then
    echo "Story name is missing!"
    exit 2
fi
if [[ $# -gt 1 ]]; then
    echo "Should only specify one parameter!"
    exit 2
fi

name=$1

node scripts/update-name.js "@cosmicds/${name}"
pascal_case_name=$(to_pascal_case $name)
title=$(space_split_pascal ${pascal_case_name})

cd src
sed -i.bak "s/MainComponent/${pascal_case_name}/g" main.ts
sed -i.bak "s/MainComponent/${pascal_case_name}/g" MainComponent.vue
sed -i.bak "s/vue-ds-template/$name/g" main.ts
sed -i.bak "s/vue-ds-template/$name/g" MainComponent.vue
rm -f main.ts.bak
mv MainComponent.vue ${pascal_case_name}.vue
rm -f MainComponent.vue.bak

cd ../public
sed -i.bak "s/CosmicDS data story template/$pascal_case_name/g" index.html
sed -i.bak "s/CosmicDS Vue template/$title/g" index.html
sed -i.bak "s/CosmicDS Vue Template/$title/g" site.webmanifest
rm -f index.html.bak
rm -f site.webmanifest.bak

# Clear out git info since we don't want this to point to the vue-ds-template repo anymore
cd ..
rm -rf .git
