# IOF XML CLI toolbox

A Command Line toolbox to work with IOF XML files.

## Installation

Download the [Deno](https://deno.com/) Javascript runtime:

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

You can pass an optionnal `--date` argument, default to today. Exemple:

```sh
iofxml winsplits --date 2025-08-31
```

### `merge`

Merges several IOF XML split times files into one. Exemple:

```sh
iofxml merge ./file-1.xml ./file-2.xml ./merged.xml
```
