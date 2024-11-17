import express, { NextFunction, Request, Response } from "npm:express@4.18.2";
import fileUpload from "npm:express-fileupload"
import { BskyAgent } from 'npm:@atproto/api'
import { timingSafeEqual } from "node:crypto";



console.log("starting")


const identifier = Deno.env.get("BLUESKY_HANDLE")
const password = Deno.env.get("BLUESKY_PASSWORD")
const apiKey = Deno.env.get("API_KEY")

const agent = new BskyAgent({
  service: 'https://bsky.social'
})







console.log("starting express")
const app = express();

app.use(fileUpload());

app.use(

  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  // Bearer <token>

    if (token == null) return res.sendStatus(401);  // No token present


    const a = await crypto.subtle.digest(
      "SHA-384",
      new TextEncoder().encode(token),
    );
    const b = await crypto.subtle.digest(
      "SHA-384",
      new TextEncoder().encode(apiKey),
    );




    if (timingSafeEqual(a, b)) {
      console.log("auth success")
      return next()
    }

    res.sendStatus(401);  // failed auth
  }

)

app.post("/post", async (req: Request, res: Response, _next: NextFunction) => {
  if (!req.files || Object.keys(req.files).length === 0 || !req?.files?.image?.data) {
    return res.status(400).send('No files were uploaded.');
  }



  let text = req?.body?.text || ""
  let alt = req?.body?.alt || ""



  console.log({ alt, text })

  console.log("logging into agent")
  await agent.login({
    identifier,
    password,
  }).then(() => console.log("initated bsky"))
    .catch((e) => {
      console.log(e.error)
      if (e.error == "RateLimitExceeded") {
        let rateLimitReset = parseInt(e.headers["ratelimit-reset"])
        let now = parseInt((Date.now() + "").slice(0, -3))
        let message = (now - rateLimitReset) / -60 + " mins until reset"
        console.log(message)
        res.sendStatus(429).send(message)
      }
    })


  try {

    // convertDataURIToUint8Array
    let image = new Uint8Array(req.files.image.data)
    console.log("uploading image...")
    const { data, } = await agent.uploadBlob(image)
    console.log("creating post...")

    const post = await agent.post({
      text,
      embed: {
        $type: 'app.bsky.embed.images',
        images: [
          // can be an array up to 4 values
          {
            alt,
            image: data.blob,
          }],
      },
      createdAt: new Date().toISOString()
    })
    console.log("post successful")
  } catch (error) {
    res.status(500).send("something fucked up" + error)

  }
  res.sendStatus(201)
  console.log("logging out of agent")
  await agent.logout()
});


app.use((_req: Request, res: Response, _next: NextFunction) => {


  res.sendStatus(404)

})

await app.listen({ port: 8080 });

// console.log("listening: http://127.0.0.1:8080")



