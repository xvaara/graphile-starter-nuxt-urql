/* eslint-disable @typescript-eslint/no-explicit-any */

import { promises as fsp } from "fs";
import type { Task } from "graphile-worker";
import { htmlToText } from "html-to-text";
import { template as lodashTemplate } from "lodash-es";
import mjml2html from "mjml";
import * as nodemailer from "nodemailer";
import * as url from 'url';
import getTransport from "../transport";

declare global {
  // eslint-disable-next-line no-var
  var TEST_EMAILS: any[];
}

globalThis.TEST_EMAILS = [];

const legalText = process.env.LEGAL_TEXT;
const fromEmail = process.env.EMAIL_FROM;
const projectName = process.env.PROJECT_NAME;
if (!legalText) {
  throw new Error("Misconfiguration: no LEGAL_TEXT");
}
if (!fromEmail) {
  throw new Error("Misconfiguration: no EMAIL_FROM");
}
if (!projectName) {
  throw new Error("Misconfiguration: no PROJECT_NAME");
}


const { readFile } = fsp;

const isTest = process.env.NODE_ENV === "test";
const isDev = process.env.NODE_ENV !== "production";

export interface SendEmailPayload {
  options: {
    from?: string;
    to: string | string[];
    subject: string;
  };
  template: string;
  variables: {
    [varName: string]: any;
  };
}

const task: Task = async (inPayload) => {
  const payload: SendEmailPayload = inPayload as any;
  const transport = await getTransport();
  const { options: inOptions, template, variables } = payload;
  const options = {
    from: fromEmail,
    ...inOptions,
  };
  if (template) {
    const templateFn = await loadTemplate(template);
    const html = await templateFn(variables);
    const html2textableHtml = html.replace(/(<\/?)div/g, "$1p");
    const text = htmlToText(html2textableHtml, {
      wordwrap: 120,
    }).replace(/\n\s+\n/g, "\n\n");
    Object.assign(options, { html, text });
  }
  const info = await transport.sendMail(options);
  if (isTest) {
    global.TEST_EMAILS.push(info);
  } else if (isDev) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) {
      // Hex codes here equivalent to chalk.blue.underline
      console.log(
        `Development email preview: \x1B[34m\x1B[4m${url}\x1B[24m\x1B[39m`
      );
    }
  }
};

export default task;

const templatePromises: Record<
  string,
  Promise<(variables: Record<string, any>) => string>
> = {};
function loadTemplate(template: string) {
  if (isDev || !templatePromises[template]) {
    templatePromises[template] = (async () => {
      if (!template.match(/^[a-zA-Z0-9_.-]+$/)) {
        throw new Error(`Disallowed template name '${template}'`);
      }
      const templateString = await readFile(
        url.fileURLToPath(`${new URL('..', import.meta.url)}/../templates/${template}`),
        "utf8"
      );
      const templateFn = lodashTemplate(templateString, {
        escape: /\[\[([\s\S]+?)\]\]/g,
      });
      return (variables: { [varName: string]: any }) => {
        const mjml = templateFn({
          projectName,
          legalText,
          ...variables,
        });
        const { html, errors } = mjml2html(mjml);
        if (errors && errors.length) {
          console.error(errors);
        }
        return html;
      };
    })();
  }
  return templatePromises[template];
}
