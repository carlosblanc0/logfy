const express = require("express");
const routes = express.Router();
const views = __dirname + "/views/";
const Profile = {
  data: {
    name: "Shelby",
    avatar:
      "https://login.vivaldi.net/profile/avatar/GunslingerTheParrot/bVazmPznJxcrl2Gn.png",
    "monthly-budget": 3000,
    "days-per-week": 5,
    "hours-per-day": 5,
    "vacation-per-year": 4,
    "value-hour": 75,
  },

  controllers: {
    index(req, res) {
      return res.render(views + "profile", { profile: Profile.data });
    },

    update(req, res) {
      const data = req.body;
      const weeksPerYear = 52;
      const weeksPerMonth = (weeksPerYear - data["vacation-per-year"]) / 12;
      const weekTotalHours = data["hours-per-day"] * data["days-per-week"];
      const monthlyTotalHours = weekTotalHours * weeksPerMonth;
      const valueHour = data["monthly-budget"] / monthlyTotalHours;

      Profile.data = {
        ...Profile.data,
        ...req.body,
        "value-hour": valueHour,
      };

      return res.redirect("/profile");
    },
  },
};

const Job = {
  data: [
    {
      id: 1,
      name: "Custom dashboard",
      "daily-hours": 2,
      "total-hours": 50,
      createdAt: Date.now(),
    },
    {
      id: 2,
      name: "Redesign project",
      "daily-hours": 3,
      "total-hours": 0,
      createdAt: Date.now(),
    },
  ],
  controllers: {
    index(req, res) {
      const updatedJobs = Job.data.map((job) => {
        const remainder = Job.services.remainingDays(job);
        const status = remainder <= 0 ? "done" : "progress";
        return {
          ...job,
          remainder,
          status,
          budget: Job.services.calculateBudget(job, Profile.data["value-hour"]),
        };
      });

      return res.render(views + "index", { jobs: updatedJobs });
    },
    create(req, res) {
      return res.render(views + "job");
    },
    save(req, res) {
      const lastId = Job.data[Job.data.length - 1]?.id || 1;
      Job.data.push({
        id: lastId + 1,
        name: req.body.name,
        "daily-hours": req.body["daily-hours"],
        "total-hours": req.body["total-hours"],
        createdAt: Date.now(),
      });
      return res.redirect("/");
    },
    show(req, res) {
      const jobId = req.params.id;
      const job = Job.data.find((job) => Number(job.id) === Number(jobId));

      if (!job) {
        return res.send("Task not found - no such entry in the database");
      }

      job.budget = Job.services.calculateBudget(
        job,
        Profile.data["value-hour"]
      );

      return res.render(views + "job-edit", { job });
    },
    update(req, res) {
      const jobId = req.params.id;
      const job = Job.data.find((job) => Number(job.id) === Number(jobId));

      if (!job) {
        return res.send("Task not found - no such entry in the database");
      }

      const updatedJob = {
        ...job,
        name: req.body.name,
        "total-hours": req.body["total-hours"],
        "daily-hours": req.body["daily-hours"],
      };

      Job.data = Job.data.map(job => {
        if (Number(job.id) === Number(jobId)) {
          job = updatedJob;
        }

        return job;
      });

      res.redirect("/job/" + jobId);
    },
    delete(req, res) {
      const jobId = req.params.id;
      Job.data = Job.data.filter(job => Number(job.id) !== Number(jobId));
      return res.redirect("/");
    },
  },
  services: {
    remainingDays(job) {
      const remainingDays = (job["total-hours"] / job["daily-hours"]).toFixed();
      const createdDate = new Date(job.createdAt);
      const dueDay = createdDate.getDate() + Number(remainingDays);
      const dueDateInMs = createdDate.setDate(dueDay);
      const timeDiffInMs = dueDateInMs - Date.now();
      const dayInMs = 1000 * 60 * 60 * 24;
      const dayDiff = Math.floor(timeDiffInMs / dayInMs);
      return dayDiff;
    },
    calculateBudget: (job, valueHour) => valueHour * job["total-hours"],
  },
};

routes.get("/", Job.controllers.index);
routes.get("/job", Job.controllers.create);
routes.post("/job", Job.controllers.save);
routes.get("/job/:id", Job.controllers.show);
routes.post("/job/:id", Job.controllers.update);
routes.post("/job/delete/:id", Job.controllers.delete);
routes.get("/profile", Profile.controllers.index);
routes.post("/profile", Profile.controllers.update);

module.exports = routes;
