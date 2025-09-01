# IOF XML CLI Toolbox

A command-line toolbox for working with IOF XML files.

## Installation

Download the [Deno](https://deno.com/) JavaScript runtime:

```sh
# On macOS or Linux
curl -fsSL https://deno.land/install.sh | sh

# On Windows
irm https://deno.land/install.ps1 | iex
```

Then install the `iofxml` command globally:

```sh
deno install -g -RWNE jsr:@orienteering-js/iofxml
```

## Usage

### `winsplits` subcommand

Interactively downloads IOF XML split times from [Winsplits](https://obasen.orientering.se/winsplits/online).

You can pass an optional `--date` argument, which defaults to today. Example:

```sh
iofxml winsplits --date 2025-08-31
```

### `merge`

Merges several IOF XML split times files into one. Example:

```sh
iofxml merge ./file-1.xml ./file-2.xml ./merged.xml
```
