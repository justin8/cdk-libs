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
import { Topic } from "@aws-cdk/aws-sns";

let defaultProps: any = {
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
const alarmsTopic = new Topic(basicStack, "topic");
defaultProps.alarmsTopic = alarmsTopic;
new LogGroupWrapper(basicStack, "MyTestConstruct", defaultProps);

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

test("No logs alarm can be disabled", () => {
  let localProps = { ...defaultProps };
  localProps.noLogsAlarm = { enabled: false };
  localProps.alarmsTopic = null;
  const basicApp = new cdk.App();
  const basicStack = new cdk.Stack(basicApp, "BasicStack");
  new LogGroupWrapper(basicStack, "MyTestConstruct", localProps);
  expectCDK(basicStack).notTo(
    haveResource("AWS::CloudWatch::Alarm", {
      MetricName: "IncomingLogEvents",
      Namespace: "AWS/Logs"
    })
  );
});

test("Errors alarm can be disabled", () => {
  let localProps = { ...defaultProps };
  localProps.errorsAlarm = { enabled: false };
  localProps.alarmsTopic = null;
  const basicApp = new cdk.App();
  const basicStack = new cdk.Stack(basicApp, "BasicStack");
  new LogGroupWrapper(basicStack, "MyTestConstruct", localProps);
  expectCDK(basicStack).notTo(
    haveResource("AWS::CloudWatch::Alarm", {
      MetricName: "MyTestConstructErrors"
    })
  );
});

test("Alarms are subscribed to given topic", () => {
  expectCDK(basicStack).to(
    haveResource("AWS::CloudWatch::Alarm", {
      MetricName: "IncomingLogEvents",
      Namespace: "AWS/Logs",
      AlarmActions: [{ Ref: "topic69831491" }]
    })
  );
  expectCDK(basicStack).to(
    haveResource("AWS::CloudWatch::Alarm", {
      MetricName: "MyTestConstructErrors",
      AlarmActions: [{ Ref: "topic69831491" }]
    })
  );
});

test("No subscriptions when alarmsTopic is unspecified", () => {
  let localProps = { ...defaultProps };
  localProps.alarmsTopic = null;
  const basicApp = new cdk.App();
  const basicStack = new cdk.Stack(basicApp, "BasicStack");
  new LogGroupWrapper(basicStack, "MyTestConstruct", localProps);
  expectCDK(basicStack).notTo(
    haveResource("AWS::CloudWatch::Alarm", {
      AlarmActions: [{ Ref: "topic69831491" }]
    })
  );
});
