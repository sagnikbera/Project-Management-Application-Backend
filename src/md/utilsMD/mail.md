### [mailgen](https://www.npmjs.com/package/mailgen)

### [nodemailer npm](https://www.npmjs.com/package/nodemailer)

---

---

---

```js
const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "maddison53@ethereal.email",
    pass: "jn7jnAPss4f63QBp6D",
  },
});

// Wrap in an async IIFE so we can use await.
(async () => {
  const info = await transporter.sendMail({
    from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
    to: "bar@example.com, baz@example.com",
    subject: "Hello ✔",
    text: "Hello world?", // plain‑text body
    html: "<b>Hello world?</b>", // HTML body
  });

  console.log("Message sent:", info.messageId);
})();
```

### [nodemailer doc](https://nodemailer.com/)

### [mailtrap](https://mailtrap.io/)

---

---

---

---

---

---

```js
import Mailgen from "mailgen"; // Mailgen helps generate beautiful HTML and text emails
import nodemailer from "nodemailer"; // Nodemailer is used to send emails via SMTP

// A utility function to send emails using Nodemailer + Mailgen
const sendEmail = async (options) => {
  // Configure Mailgen with theme and product details
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project-Management", // App/brand name shown in email
      link: "https://github.com/sagnikbera/Project-Management-Application-Backend", // Project link
    },
  });

  // Generate plain text and HTML versions of email content
  const emailTexual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHTML = mailGenerator.generate(options.mailgenContent);

  // Configure Nodemailer SMTP transporter (Mailtrap used here for testing)
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST, // Mailtrap host from env
    port: process.env.MAILTRAP_SMTP_PORT, // Mailtrap port
    auth: {
      user: process.env.MAILTRAP_SMTP_USER, // Mailtrap username
      pass: process.env.MAILTRAP_SMTP_PASS, // Mailtrap password
    },
  });

  // Define email structure
  const mail = {
    from: "mail.projectmanager@example.com", // Sender address
    to: options.email, // Recipient email
    subject: options.subject, // Email subject
    text: emailTexual, // Plain text version
    html: emailHTML, // HTML version
  };

  // Send email and handle errors
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("may be happen for MAILTRAP credentials");
    console.error("Error : ", error);
  }
};

// Generate email verification email content
const emailVerificationMail = (username, verificationUrl) => {
  return {
    body: {
      name: username, // Recipient's name
      intro: "Welcome to our App! We'are excited to have you on board.", // Greeting
      action: {
        instructions:
          "To verify your email please click on the following button.", // Instructions
        button: {
          color: "#22BC66", // Button color
          text: "Verify your email", // Button text
          link: verificationUrl, // Button link
        },
      },
      outro:
        "Need help, or have question? Connect to linkedIn (https://www.linkedin.com/in/sagnik-bera/)", // Footer note
    },
  };
};

// Exporting functions so they can be used in other files
export { emailVerificationMail, sendEmail };
```
