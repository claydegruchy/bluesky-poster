


FROM denoland/deno

EXPOSE 8000

WORKDIR /app

ADD . /app

RUN deno install --entrypoint main.ts

CMD ["run","--allow-read=.", "--allow-env" ,"--allow-net", "main.ts"]


