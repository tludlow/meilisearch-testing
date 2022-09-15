import { MeiliSearch } from "meilisearch";
import Fastify from "fastify";
import { faker } from "@faker-js/faker";

const meili = new MeiliSearch({
  host: "127.0.0.1:7700",
  apiKey: "123changeme",
});

const generateData = () => {
  const products = [];

  for (let i = 0; i < 10000; i++) {
    products.push({
      id: faker.datatype.uuid(),
      title: faker.commerce.productName(),
      body: faker.commerce.productDescription(),
      created: faker.date.recent().getTime(),
      soldOut: faker.datatype.boolean(),
    });
  }

  return products;
};

const fastify = Fastify({
  logger: false,
});

fastify.get("/", async (request, reply) => {
  const res = await meili.index("products").updateSettings({
    searchableAttributes: ["title", "description"],
    filterableAttributes: ["soldOut"],
    sortableAttributes: ["created"],
  });

  reply.send({ res });
});

fastify.get("/delete", async (request, reply) => {
  const deleted = await meili.deleteIndex("products");
  reply.send({ deleted });
});

fastify.get("/settings", async (request, reply) => {
  const settings = await meili.index("products").getSettings();
  reply.send({ settings });
});

fastify.get("/import", async (req, res) => {
  const importData = generateData();
  const addData = await meili.index("products").addDocuments(importData, {
    primaryKey: "id",
  });

  res.send({ meilisearch: addData });
});

fastify.get("/tasks", async (req, res) => {
  res.send({
    tasks: await meili.getTasks({
      limit: 30,
    }),
  });
});

fastify.get("/dataflow", async (req, res) => {
  let count = 1;
  setInterval(async () => {
    count++;
    await meili.index("products").addDocuments([
      {
        id: faker.datatype.uuid(),
        title: faker.commerce.productName(),
        body: faker.commerce.productDescription(),
        created: faker.date.recent().getTime(),
      },
    ]);
    if (count === 3) {
      res.send({ done: true });
    }
  }, 1000);
});

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  console.log(`Server now started on: ${address}`);
});
