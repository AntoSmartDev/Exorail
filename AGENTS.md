# AGENTS.md

The operating contract for this repository is `.exorail/AGENTS.md`. Read it
before any work; it names every file to load, in the order to load them, with
its exact path.

This file is a bridge and holds no rule of its own. Rules live in one place so
that every supported entrypoint reaches the same contract: a rule recorded only
here would be invisible to an agent that enters through a provider-specific
bridge such as `CLAUDE.md`.
