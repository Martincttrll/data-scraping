import puppeteer from "puppeteer";
import fs from "fs";

// Lancer le navigateur et ouvrir une nouvelle page
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto("https://lannuaire.service-public.fr/navigation/mairie");
await page.setViewport({ width: 1080, height: 1024 });

let allLinks = [];
let currentPage = 1;
const maxPages = 20;

// Boucle de pagination pour récupérer les liens
while (currentPage <= maxPages) {
  // Récupérer les liens sur la page actuelle
  const links = await page.$$eval(
    '.fr-link[data-test="href-link-annuaire"]',
    (elements) => elements.map((el) => el.href)
  );
  allLinks = allLinks.concat(links);

  // Vérifier si un élément `li.active` est présent dans la pagination
  const nextPageButton = await page.$("ul.fr-pagination__list li.active + li");

  if (!nextPageButton) {
    console.log("Fin de la pagination ou dernière page atteinte");
    break;
  }

  // Aller à la page suivante
  await nextPageButton.click();
  await page.waitForNavigation();
  currentPage++;
}

// Après avoir collecté tous les liens, récupérer les emails
let emails = [];
for (const link of allLinks) {
  await page.goto(link);

  // Récupérer l'élément contenant l'email
  const emailElement = await page.$(".send-mail");

  if (emailElement) {
    const email = await page.evaluate((el) => el.textContent, emailElement);
    emails.push(email);
  }
}

// Écrire les emails dans un fichier CSV
const filePath = "output.csv";
emails.forEach((email) => {
  // Ajouter chaque adresse e-mail dans le fichier, une par ligne
  fs.appendFileSync(filePath, `${email}\n`);
});

console.log("Emails ajoutés dans output.csv");
await browser.close();
