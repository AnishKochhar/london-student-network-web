# London Students Network Website
Here you will find the techstack for  `lsn web` project

## General Setup 

In the root of directory you can find general setup for all parts of the project.

Basically we just need `nix` installed and `devbox`, all tools are installed and managed by it. Devbox is a layer on top of nix.
Another tool very useful is `direnv` that will load automatically the environment when you enter the directory. This is super nice to load env var and automatic activate shell of devbox.
That's because you will find a `.envrc` file in the root of the directory.

- .envrc -> will load the environment automatically if you have `direnv` installed, basically is important that load nix
stuff, other ENV var or customizations can be changed by the user. Please don't commit super secret stuff in this file.
When you enter in a subdirectory you will find a `.envrc` file that will load the environment for that specific part of the project,
all variables and tools are cumulative, so all things from root are available in the subdirectory.
- devbox.json -> will download and load all the tools needed for the project, if you have `direnv` installed it will load automatically,
otherwise you can load it manually with `devbox shell`.

### Devbox Script

Devbox allow you to setup some script as a shortcut.
Take a closer look into file `devbox.json` if you want to know which commands are available

Most of those are based on root folder, but you can run in other folders, clearly if you have some commands like `cd` it will not works. Those are primary for CI usage, in this way we can run exactly same command we run locally with native tools like `go test`

### Create a changes

In `devbox` we also have the graphite tool (`gt`), in this workflow (like gerrit), every changes is commit and every commit is a PR, many PR are a stack.
You can work on different stack if you are working on different topic, but in this way is super easy to follow along the review.

Simple example on first changes:
- cd <folder>
- change code
- git add what you need
- gt create -> this allows you to create a commit using graphite tool
- gt submit -> it will open a "changes" with your commit

We strongly recommend using graphite tool but there is also the possibility to create PR using git following the steps:
- git checkout -b /feat/name
- change code 
- git add . 
- git commit -m "Commit message"
- git push --set-upstream /remotes/origin/feat/name

## Getting Started

On first cloning the repo run `pnpm install`

Run `pnpm run dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Engineering principles

We believe in the excellence of the engineering part of the product. Success in engineering is the result of good practices, good tools and good people. We are always looking for the best tools and practices to improve our work.

### Being a good people:

1. Be kind
2. Be open to feedback
3. Be transparent, chat, mail, call, whatever, but always be transparent
4. Be respectful
5. Be a team player. Means collaboration and communication,

### Being a good engineer:

1. Write good commits. A good commit is a commit that can be read by a human and understand what is the purpose of the commit, it should involve only one feature or bug fix in order to be easily reverted or cherry-picked or understood. Read this [article](https://chris.beams.io/posts/git-commit/) and this [one](https://www.develer.com/en/blog/git-come-scrivere-commits-e-perche/)

2. Write good RFCs or ADRs. Those are documents that explain the reason behind a decision. It is important to write them because they are a way to share knowledge, to make the decision process transparent and involve all people. More info [here](https://adr.github.io/)

3. Choose right tools. Don't mean always pick the latest tool or language but also don't stuck on outdated frameworks or languages. Choose the right tool for the right job. Best effort between consistency with our stack, innovation and best for the job.

4. Documentation firts. If you introduce new tools, new command, different way to do things, write it down. It is important to have a good documentation to help new people to onboard and to help the team to remember how to do things.
