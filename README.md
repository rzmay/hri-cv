# 16-467

### Installing dependencies

This project requires Python and Deno to run. To install Deno follow their
installation guides at
https://docs.deno.com/runtime/getting_started/installation/

To install the python dependencies necessary, navigate to `v1/emotion` and run
`pip install -r requirements.txt`

Deno does not require that you install dependencies, as they are loaded from
cloud registries.

### Secrets

Create a file in `v1/agent/` called `.env`. Enter the OpenAI API key in the
format

```
OPENAI_API_KEY="API key goes here"
```

If you don't have your own API key ask Robert

### Running the chat agent

Navigate to `v1/agent` and run `deno run start`. When prompted, enter the
variation of the trial. The variants are as follows:

- 0 - control
- 1 - semi-control (no instruction, emotion still provided)
- 2 - emotional mimicry
- 3 - sympathy
- 4 - improve mood

See `v1/agent/instructions` for the correlated instructions.

The process will then wait for emotion detection to begin. Start this process by
navigating in a different terminal window to `v1/emotion` and running
`python main.py`. Once the emotion server starts, the form will begin
automatically and the user may begin answering questions.

### Trial data

After the trial ends, trial data will be saved to `v1/agent/trial_data`. All
times are measured in milliseconds.
