#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { cancel, intro, isCancel, outro, select } from "@clack/prompts";
import { parseArgs } from "@std/cli";
import { DOMParser, HTMLElement } from "linkedom";
import { TWO_D_RERUN_URL } from "./constants.ts";

interface CliArgs {
  _: string[];
  date?: string;
  help?: boolean;
}

const parser = new DOMParser();

function showHelp() {
  console.log(`
Usage: iofxml <command> [options]

Commands:
  winsplits [--date <date>]    Interactively Download split times from winsplits
  merge <input1> [input2...] <output>    Merge multiple split times files into one

Options:
  --help, -h                   Show this help message
  --date <date>                Date string for winsplits command

Examples:
  iofxml winsplits --date "2025-09-01"
  iofxml merge file1.xml file2.xml output.xml
`);
}

async function winsplitsCommand(args: CliArgs) {
  const dateArg = args.date;
  const date = dateArg ? new Date(dateArg) : new Date();

  if (isNaN(date.getTime())) {
    console.error(`Error: Invalid date '${dateArg}'`);
    Deno.exit(1);
  }

  intro(`Fetching Events from Winsplit on ${date.toDateString()}`);

  const eventsResponse = await fetch(
    `${TWO_D_RERUN_URL}?date=${date.toISOString().split("T")[0]}`,
    {
      headers: { Referer: "http://loggator2.worldofo.com" },
    }
  );

  if (!eventsResponse.ok) {
    console.error(`Error: Failed to fetch data from ${TWO_D_RERUN_URL}`);
    Deno.exit(1);
  }

  const eventsText = await eventsResponse.text();
  const eventsDoc = parser.parseFromString(eventsText, "text/xml");

  const events: { id: string; name: string }[] = [];

  eventsDoc.querySelectorAll("Event").forEach((event: HTMLElement) => {
    const idElement: HTMLElement | null = event.querySelector("Id");

    if (!idElement) {
      console.error("No Id tag in Event.");
      Deno.exit(1);
    }

    const id = idElement?.textContent.trim();

    if (!id) {
      console.error("No Id in Event.");
      Deno.exit(1);
    }

    const nameElement: HTMLElement | null = event.querySelector("Name");

    if (!nameElement) {
      console.error("No Name tag in Event.");
      Deno.exit(1);
    }

    const name = nameElement?.textContent.trim();

    if (!name) {
      console.error("No Name in Event.");
      Deno.exit(1);
    }

    events.push({ id, name });
  });

  const eventId = await select({
    message: "Pick an event",
    options: events.map((event) => ({ value: event.id, label: event.name })),
  });

  if (isCancel(eventId)) {
    cancel("Cancelled.");
    Deno.exit(1);
  }

  const classesResponse = await fetch(`${TWO_D_RERUN_URL}?id=${eventId}`, {
    headers: { Referer: "http://loggator2.worldofo.com" },
  });

  if (!classesResponse.ok) {
    console.error(`Error: Failed to fetch data from ${TWO_D_RERUN_URL}`);
    Deno.exit(1);
  }

  const classesText = await classesResponse.text();
  const classesDoc = parser.parseFromString(classesText, "text/xml");

  const classes: { id: string; name: string }[] = [];

  classesDoc.querySelectorAll("Class").forEach((classElement: HTMLElement) => {
    const idElement: HTMLElement | null = classElement.querySelector("Id");

    if (!idElement) {
      console.error("No Id tag in Class tag.");
      Deno.exit(1);
    }

    const id = idElement?.textContent.trim();

    if (!id) {
      console.error("No Id in Class tag.");
      Deno.exit(1);
    }

    const nameElement: HTMLElement | null = classElement.querySelector("Name");

    if (!nameElement) {
      console.error("No Name tag in Class tag.");
      Deno.exit(1);
    }

    const name = nameElement?.textContent.trim();

    if (!name) {
      console.error("No Name in Class tag.");
      Deno.exit(1);
    }

    classes.push({ id, name });
  });

  const classId = await select({
    message: "Pick a class",
    options: classes.map((event) => ({ value: event.id, label: event.name })),
  });

  if (isCancel(classId)) {
    cancel("Cancelled.");
    Deno.exit(1);
  }

  const iofXmlFileResponse = await fetch(
    `${TWO_D_RERUN_URL}?id=${eventId}&classid=${classId}`
  );

  if (!iofXmlFileResponse.ok) {
    console.error(`Error: Failed to fetch IOF XML data`);
    Deno.exit(1);
  }

  const selectedEvent = events.find((e) => e.id === eventId)!;
  const selectedClass = classes.find((c) => c.id === classId)!;

  const filename = `${cleanName(selectedEvent.name)}_${cleanName(
    selectedClass.name
  )}.xml`;

  const file = await Deno.open(filename, { create: true, write: true });

  try {
    await iofXmlFileResponse.body?.pipeTo(file.writable);
    outro("IOF XML splits times file downloaded.");
  } catch (error) {
    console.error(`Error writing file: ${error}`);
    Deno.exit(1);
  }
}

function cleanName(name: string): string {
  return name
    .split(" ")
    .filter((s) => !["-", "_", '"', "'"].includes(s))
    .join("_")
    .toLowerCase();
}

async function mergeCommand(args: CliArgs) {
  const positionalArgs = args._;

  if (positionalArgs.length < 3) {
    console.error(
      "Error: merge command requires at least 2 input files and 1 output file"
    );
    console.error("Usage: iofxml merge <input1> [input2...] <output>");
    Deno.exit(1);
  }

  const firstInputPaths = positionalArgs[1];
  const restInputPaths = positionalArgs.slice(2, -1);
  const outputPath = positionalArgs[positionalArgs.length - 1];

  const firstFileContent = await Deno.readTextFile(firstInputPaths);
  const document = parser.parseFromString(firstFileContent, "text/xml");
  const classResultTag: HTMLElement = document.querySelector("ClassResult");

  if (!classResultTag) {
    console.error(`No ClassResult tag in ${firstInputPaths} file.`);
    Deno.exit(1);
  }

  for (const inputPath of restInputPaths) {
    const fileContent = await Deno.readTextFile(inputPath);
    const doc = parser.parseFromString(fileContent, "text/xml");

    const personResultTag = doc.querySelectorAll("PersonResult");

    if (!personResultTag) {
      console.error(`No PersonResult tag in ${inputPath} file.`);
      Deno.exit(1);
    }

    classResultTag.append(...personResultTag);
  }

  await Deno.writeTextFile(outputPath, document.toString());
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ["date"],
    boolean: ["help"],
    alias: {
      h: "help",
    },
  }) as CliArgs;

  if (args.help) {
    showHelp();
    return;
  }

  const command = args._[0];

  if (!command) {
    console.error("Error: No command specified");
    showHelp();
    Deno.exit(1);
  }

  switch (command) {
    case "winsplits":
      winsplitsCommand(args);
      break;

    case "merge":
      await mergeCommand(args);
      break;

    default:
      console.error(`Error: Unknown command '${command}'`);
      showHelp();
      Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
