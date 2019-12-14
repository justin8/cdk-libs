import {
  expect as expectCDK,
  haveResource,
  expect,
  SynthUtils,
  HaveResourceAssertion
} from "@aws-cdk/assert";
import cdk = require("@aws-cdk/core");
import { LogGroupWrapper } from "../lib/index";
import { FilterPattern } from "@aws-cdk/aws-logs";

const props = {
  logGroupName: "/var/log/foo.log",
  filterPattern: FilterPattern.anyTerm("error", "Error"),
  noLogsAlarm: {
    enabled: true,
    evaluationPeriods: 1,
    metricPeriod: cdk.Duration.days(1),
    threshold: 5
  },
  errorsAlarm: {
    enabled: true,
    evaluationPeriods: 1,
    metricPeriod: cdk.Duration.minutes(5),
    threshold: 1
  }
};

const basicApp = new cdk.App();
const basicStack = new cdk.Stack(basicApp, "BasicStack");
new LogGroupWrapper(basicStack, "MyTestConstruct", props);

test("Log group created", () => {
  expectCDK(basicStack).to(haveResource("AWS::Logs::LogGroup"));
});

test("Metric Filter group created", () => {
  expectCDK(basicStack).to(haveResource("AWS::Logs::MetricFilter"));
});

test("Errors Alarm created", () => {
  expectCDK(basicStack).to(
    haveResource("AWS::CloudWatch::Alarm", {
      MetricName: "MyTestConstructErrors"
    })
  );
});

test("No Logs Alarm created", () => {
  expectCDK(basicStack).to(
    haveResource("AWS::CloudWatch::Alarm", {
      MetricName: "IncomingLogEvents",
      Namespace: "AWS/Logs"
    })
  );
});
