const dotenv = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const colors = require("colors");
var watson = require("./util/watson");

//Route files
const index = require("./routes/index");
const app = express();
dotenv.config({ path: "./config/config.env" });

//Mount the router
app.use("/api/v1", index);

app.use("/", express.static("public"));

const PORT = process.env.PORT;
const server = app.listen(
  PORT,
  console.log(`Server running on port ${PORT}`.yellow)
);

//Handel unhandled promise rejections
process.on("unhandledRejection", (err, Promise) => {
  console.log(`Error  ${err.message}`.red);
  //close server & exit process
  server.close(() => process.exit(1));
});

var io = require("socket.io")(server);
var ss = require("socket.io-stream");
const { options } = require("./routes/index");
io.on("connection", function (socket) {
  console.log("Connected");

  var context = {};
  socket.on("sendmsg", function (data) {
    watson.message(data.message, context, function (err, res) {
      if (!err) {
        //console.log(res);
        context = res.result.context;
        // console.log("Isi respon Message", res.result.output);
        // console.log("Respon text1", res.result.output.generic[0].text);
        // console.log("Respon text2", res.result.output.generic[1].text);
        // console.log("Respon text3", res.result.output.generic[2].text);

        if (res.result.output.generic.length <= 1) {
          conversation_response = res.result.output.generic[0].text;
          obj = "";
        } else if (res.result.output.generic.length > 1) {
          conversation_response = res.result.output.generic[0].text;
          conversation_response2 = res.result.output.generic[1].text;

          obj = JSON.parse(conversation_response2);
          // console.log("Objek", obj);
        }
        var payload = {
          user: "Bot Berita",
          message: conversation_response,
          isiberita: obj,
          ts: new Date().getTime(),
          type: res.result.output.generic[0].response_type,
        };
        socket.emit("replymsg", payload);
        // }
      }
    });
  });

  ss(socket).on("recognize", function (stream, data) {
    watson.recognize(
      stream,
      function (err) {
        console.log("Error:", err);
      },
      function (res) {
        var transcript = res;
        socket.emit("transcript", { message: transcript, ts: data.ts });
        console.log(JSON.stringify(res, null, 2));
      }
    );
  });
});
