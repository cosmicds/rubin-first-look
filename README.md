# Vue Data Story Template

This repository contains a template for setting up a purely Vue-based Cosmic Data Story using WorldWide Telescope. This template is built using components from [`@cosmicds/vue-toolkit`](https://github.com/cosmicds/vue-toolkit), which is included here as a dependency. This template sets up the basic infrastructure for a story - integrating the WorldWide Telescope component, providing some basic HTML scaffolding for placing controls in the main component, and generally providing the overall Vue project structure.

## Usage

To start creating your own data story, you can use the following steps.

* First, clone the repository, setting the name of the destination folder as appropriate for your story
```
git clone https://github.com/cosmicds/vue-ds-template.git <my-story-name>
```
* Next, you can run the setup script to do some basic renaming for you. You should give the story name in `kebab-case`. Where conventions dictate, the script will automatically rename using `PascalCase` and `camelCase`.
```
cd <my-story-name>
scripts/setup.sh <my-story-name>
```
If you get complaints that the script isn't executable, make it so by running `chmod +x scripts/setup.sh`.

* That's it! You're now ready to start creating your story. As mentioned above, we provide some basic layout scaffolding in the main component template, but feel free to remove whatever doesn't fit your story's needs.
    - To preview the story using the development server, run `yarn serve`
    - To build the story for production use, run `yarn build`

## Deployment and Github Actions

The built story is just a set of HTML/CSS/JS + any assets that you add, so it should be easy to host anywhere. One simple way to host a story is using Github Pages, which provides a free static site hosting service for public repositories. This repository provides two workflows (see the `.github/workflows` directory) to help with this:
* `build.yml` - on a pull request, build the PR version of the story (to test that it at least builds successfully)
* `build-deploy.yml` - on a commit to main, build the story and push the built version to the `gh-pages` branch. This built version can then be deployed to Github Pages in the repository settings: `Settings > Pages`, then choose `Deploy from a branch` and use the `gh-pages` branch.

## BrowserStack testing - CosmicDS team

If you're a member of the CosmicDS team, we can perform E2E testing (both locally and in Github Actions) using BrowserStack. To activate this testing, uncomment the relevant pieces in the provided workflows. Note that you'll need to have our BrowserStack username and access key for this to work correctly. (If the repository that you're working on is part of the CosmicDS organization, you shouldn't need to add these at the repository level).
