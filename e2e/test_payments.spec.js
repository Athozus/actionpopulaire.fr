import { test, expect } from "@playwright/test";

test("test don 10€ cb anonyme", async ({ page }) => {
  await page.goto("https://agir-preprod.franceinsoumise.org/dons/");

  await page.getByRole("button", { name: "10 €" }).click();
  await page.getByRole("button", { name: "Monsieur" }).click();
  await page.getByRole("textbox", { name: "Prénom*" }).fill("Test");
  await page.getByRole("textbox", { name: "Nom*", exact: true }).fill("test");
  await page.getByRole('textbox', { name: '/08/1951' }).fill('19/08/1951');
  await page.getByRole('textbox', { name: '/08/1951' }).press('Tab');
  await page.getByRole('combobox', { name: 'option France, selected.' }).press('Tab');
  await page.getByRole('combobox', { name: 'Adresse* Votre adresse n\'' }).fill('25 passage dubail');
  await page.getByText('25, Passage Dubail, Quartier').click();
  await page.getByRole('textbox', { name: 'Commune*' }).click();
  await page.getByRole('textbox', { name: 'Commune*' }).fill('Paris');
  await page.locator('.sc-dtImxT.fZYwuO > .css-b62m3t-container > .select__control > .select__value-container > .select__input-container').click();
  await page.getByRole('combobox', { name: '120 results available.Use Up' }).fill('75');
  await page.getByRole('option', { name: '— Paris' }).click();
  await page
    .getByRole("textbox", { name: "Numéro de téléphone* Nous" })
    .fill("06 00 00 00 00");
  await page
    .getByRole("textbox", { name: "Adresse e-mail*" })
    .fill("test@test.com");
  await page
    .locator("label")
    .filter({ hasText: "Je certifie sur l'honneur ê" })
    .click();
  await page.getByRole("button", { name: "Payer par carte bancaire" }).click();
  await page
    .getByRole("button", { name: "DONNER À LA FRANCE INSOUMISE" })
    .click();
  await page.waitForURL("https://paiement.systempay.fr/vads-payment/");
  await expect(page.locator("#transaction_amount_label")).toContainText(
    "10.00 EUR",
    { timeout: 10000 },
  );
});

test("test don mensuel anonyme", async ({ page }) => {
  await page.goto("https://agir-preprod.franceinsoumise.org/dons/");
  await page.getByRole("button", { name: "Don mensuel" }).click();
  await page.getByRole("button", { name: "10 €" }).click();
  await page.getByRole("button", { name: "Monsieur" }).click();
  await page.getByRole("textbox", { name: "Prénom*" }).click();
  await page.getByRole("textbox", { name: "Prénom*" }).fill("test");
  await page.getByRole("textbox", { name: "Nom*", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom*", exact: true }).fill("test");
  await page.getByRole('textbox', { name: '/08/1951' }).fill('19/08/1951');
  await page.getByRole('textbox', { name: '/08/1951' }).press('Tab');
  await page.getByRole('combobox', { name: 'option France, selected.' }).press('Tab');
  await page.getByRole('combobox', { name: 'Adresse* Votre adresse n\'' }).fill('25 passage dubail');
  await page.getByText('25, Passage Dubail, Quartier').click();
  await page.getByRole('textbox', { name: 'Commune*' }).click();
  await page.getByRole('textbox', { name: 'Commune*' }).fill('Paris');
  await page.locator('.sc-dtImxT.fZYwuO > .css-b62m3t-container > .select__control > .select__value-container > .select__input-container').click();
  await page.getByRole('combobox', { name: '120 results available.Use Up' }).fill('75');
  await page.getByRole('option', { name: '— Paris' }).click();
  await page
    .getByRole("textbox", { name: "Numéro de téléphone* Nous" })
    .click();
  await page
    .getByRole("textbox", { name: "Numéro de téléphone* Nous" })
    .fill("06 00 00 00 00");
  await page.getByRole("textbox", { name: "Adresse e-mail*" }).click();
  await page
    .getByRole("textbox", { name: "Adresse e-mail*" })
    .fill("test@test.com");
  await page
    .locator("label")
    .filter({ hasText: "Je certifie sur l'honneur ê" })
    .locator("span")
    .first()
    .click();
  await page.getByRole("button", { name: "Payer par carte bancaire" }).click();
  await page
    .getByRole("button", { name: "DONNER À LA FRANCE INSOUMISE" })
    .click();
  await page.waitForURL(
    "https://agir-preprod.franceinsoumise.org/dons-mensuels/confirmer/attente/",
  );
});

test("test si l'ordre du cheque est bien affiché lors qu'on est pas connecté", async ({
  page,
}) => {
  await page.goto("https://agir-preprod.franceinsoumise.org/dons/");

  await page.getByRole("button", { name: "10 €" }).click();
  await page.getByRole("button", { name: "Monsieur" }).click();
  await page.getByRole("textbox", { name: "Prénom*" }).fill("Test");
  await page.getByRole("textbox", { name: "Nom*", exact: true }).fill("test");
  await page.getByRole('textbox', { name: '/08/1951' }).fill('19/08/1951');
  await page.getByRole('textbox', { name: '/08/1951' }).press('Tab');
  await page.getByRole('combobox', { name: 'option France, selected.' }).press('Tab');
  await page.getByRole('combobox', { name: 'Adresse* Votre adresse n\'' }).fill('25 passage dubail');
  await page.getByText('25, Passage Dubail, Quartier').click();
  await page.getByRole('textbox', { name: 'Commune*' }).click();
  await page.getByRole('textbox', { name: 'Commune*' }).fill('Paris');
  await page.locator('.sc-dtImxT.fZYwuO > .css-b62m3t-container > .select__control > .select__value-container > .select__input-container').click();
  await page.getByRole('combobox', { name: '120 results available.Use Up' }).fill('75');
  await page.getByRole('option', { name: '— Paris' }).click();
  await page
    .getByRole("textbox", { name: "Numéro de téléphone* Nous" })
    .fill("06 00 00 00 00");
  await page
    .getByRole("textbox", { name: "Adresse e-mail*" })
    .fill("test@test.com");
  await page
    .locator("label")
    .filter({ hasText: "Je certifie sur l'honneur ê" })
    .click();
  await page.getByRole("button", { name: "Payer par chèque" }).click();
  await page
    .getByRole("button", { name: "DONNER À LA FRANCE INSOUMISE" })
    .click();
  await expect(page.getByText("AFLFI")).toBeVisible();
  await expect(page.getByText("Montant : 10 €")).toBeVisible();
  await expect(page.getByText("91305 MASSY CEDEX")).toBeVisible();
});