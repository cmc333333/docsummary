const PROJECT_ID = "cm-docsummary";
const REGION = "us-west1";

const onHomepage = () => ui();

const ui = (summary?: string, keyPoints?: string) => {
  const builder = CardService.newCardBuilder();
  builder.addSection(
    CardService.newCardSection()
      .setHeader("Summarize")
      .addWidget(
        CardService.newButtonSet()
          .addButton(
            CardService.newTextButton()
              .setText("Document")
              .setOnClickAction(
                CardService.newAction().setFunctionName("summarizeDoc")
              )
          )
          .addButton(
            CardService.newTextButton()
              .setText("Selection")
              .setOnClickAction(
                CardService.newAction().setFunctionName("summarizeSelection")
              )
          )
      )
  );

  if (summary) {
    builder.addSection(
      CardService.newCardSection()
        .setHeader("Summary")
        .addWidget(CardService.newTextParagraph().setText(summary))
    );
  }
  if (keyPoints) {
    builder.addSection(
      CardService.newCardSection()
        .setHeader("Themes")
        .addWidget(CardService.newTextParagraph().setText(keyPoints))
    );
  }

  return builder.build();
};

const summarizeDoc = () =>
  summarize(DocumentApp.getActiveDocument().getBody().getText());

const summarizeSelection = () => {
  let text = "";
  const selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    const elements = selection.getRangeElements();
    for (var i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.getElement().asText()) {
        let eltText = element.getElement().asText().getText();
        if (element.isPartial()) {
          eltText = eltText.substring(
            element.getStartOffset(),
            element.getEndOffsetInclusive() + 1
          );
        }
        if (eltText !== "") {
          text += eltText + "\n";
        }
      }
    }
  }
  if (text === "") {
    return ui("Please highlight text to use this feature.");
  }
  return summarize(text);
};

const summarize = (text: string) =>
  ui(
    callGemini(
      "Summarize the following document as a short paragraph:\n```" +
        text +
        "```",
      2048,
      0.2
    ),
    callGemini(
      "List the recurring themes in the following document. Use the format - Theme1\n- Theme2\n- Theme3\n```" +
        text +
        "```",
      1024,
      0.6
    )
  );

const callGemini = (
  prompt: string,
  maxOutputTokens: number,
  temperature: number
) => {
  const response = UrlFetchApp.fetch(
    `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/gemini-pro:streamGenerateContent`,
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings: [
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        ],
        generationConfig: {
          maxOutputTokens,
          temperature,
        },
      }),
      headers: {
        Authorization: "Bearer " + ScriptApp.getOAuthToken(),
      },
    }
  );
  let text = "";
  JSON.parse(response.getContentText()).forEach((streamPart) => {
    text += streamPart.candidates[0].content.parts[0].text;
  });
  return text;
};
