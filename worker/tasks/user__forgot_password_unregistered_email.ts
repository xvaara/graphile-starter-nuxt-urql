import type { Task } from "graphile-worker";

import type { SendEmailPayload } from "./send_email";

const projectName = process.env.PROJECT_NAME;
interface UserForgotPasswordUnregisteredEmailPayload {
  email: string;
}

const task: Task = async (inPayload, { addJob }) => {
  const payload: UserForgotPasswordUnregisteredEmailPayload = inPayload as UserForgotPasswordUnregisteredEmailPayload;
  const { email } = payload;

  const sendEmailPayload: SendEmailPayload = {
    options: {
      to: email,
      subject: `Password reset request failed: you don't have a ${projectName} account`,
    },
    template: "password_reset_unregistered.mjml",
    variables: {
      url: process.env.ROOT_URL,
    },
  };
  await addJob("send_email", sendEmailPayload);
};

module.exports = task;
