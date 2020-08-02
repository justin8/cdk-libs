# CDK Log Wrapper

This module wraps basic settings for a CloudWatch log group; such as alarming on no logs or error messages in logs, along with subscribing to SNS topics for alarming.

## Usage

```typescript
const basicApp = new cdk.App();
const basicStack = new cdk.Stack(basicApp, "BasicStack");
const alarmsTopic = new Topic(basicStack, "topic");
const logGroupOne = new LogGroupWrapper(basicStack, "MyTestConstruct", {
  logGroupName: "/var/log/foo.log",
  alarmsTopic: alarmsTopic,
  filterPattern: FilterPattern.anyTerm("error", "Error"),
  noLogsAlarm: {
    enabled: true,
    evaluationPeriods: 5,
    metricPeriod: cdk.Duration.hours(1),
    threshold: 5,
  },
  errorsAlarm: {
    enabled: true,
    evaluationPeriods: 1,
    metricPeriod: cdk.Duration.minutes(5),
    threshold: 1,
  },
});
```

From the above:

- The named log group is created
- A metric filter is attached to filter on the given terms for errors/faults
- An alarm is created that will trigger when there are less than 5 lines of logs submitted to the log group in any 5 hour period
- An alarm is created that will trigger when there is one or more errors in the log file as determined by the given `filterPattern`
- The list of alarms is available at `logGroupOne.alarms`
