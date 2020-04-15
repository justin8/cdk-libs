import { IFilterPattern, LogGroup, MetricFilter } from "@aws-cdk/aws-logs";
import { Construct, Duration, StackProps } from "@aws-cdk/core";
import { SnsAction } from "@aws-cdk/aws-cloudwatch-actions";
import { ITopic } from "@aws-cdk/aws-sns";
import {
  Alarm,
  ComparisonOperator,
  TreatMissingData,
  Metric,
} from "@aws-cdk/aws-cloudwatch";

export interface LogGroupProps extends StackProps {
  logGroupName: string;
  filterPattern: IFilterPattern;
  noLogsAlarm: AlarmProps;
  errorsAlarm: AlarmProps;
  alarmsTopic?: ITopic;
}

export interface AlarmProps {
  enabled: boolean;
  evaluationPeriods?: number;
  metricPeriod?: Duration;
  threshold?: number;
}

export class LogGroupWrapper extends Construct {
  public alarms: Array<Alarm> = [];

  constructor(parent: Construct, name: string, props: LogGroupProps) {
    super(parent, name);

    const errorMetricName = `${name}Errors`;
    const metricNamespace = "LogMetrics";
    const errorsAlarm = props.errorsAlarm;
    const noLogsAlarm = props.noLogsAlarm;

    const logGroup = new LogGroup(this, `${name}LogGroup`, {
      logGroupName: props.logGroupName,
    });

    new MetricFilter(this, `${name}Errors`, {
      filterPattern: props.filterPattern,
      logGroup: logGroup,
      metricValue: "1",
      metricName: errorMetricName,
      metricNamespace: metricNamespace,
    });

    // Alarms
    if (errorsAlarm.enabled) {
      this.alarms.push(
        new Alarm(this, `${name}ErrorsAlarm`, {
          actionsEnabled: true,
          alarmDescription: `An error was found in the ${props.logGroupName} log group`,
          threshold: errorsAlarm.threshold!,
          comparisonOperator:
            ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          evaluationPeriods: errorsAlarm.evaluationPeriods!,
          treatMissingData: TreatMissingData.NOT_BREACHING,
          metric: new Metric({
            metricName: errorMetricName,
            namespace: metricNamespace,
            period: errorsAlarm.metricPeriod!,
          }),
        })
      );
    }

    if (noLogsAlarm.enabled) {
      this.alarms.push(
        new Alarm(this, `${name}NoLogsAlarm`, {
          actionsEnabled: true,
          alarmDescription: `No logs have been found recently for the ${props.logGroupName} log group`,
          threshold: noLogsAlarm.threshold!,
          comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
          evaluationPeriods: noLogsAlarm.evaluationPeriods!,
          treatMissingData: TreatMissingData.BREACHING,
          statistic: "sum",
          metric: new Metric({
            metricName: "IncomingLogEvents",
            namespace: "AWS/Logs",
            period: noLogsAlarm.metricPeriod!,
            dimensions: { LogGroupName: logGroup.logGroupName },
          }),
        })
      );
    }

    if (props.alarmsTopic) {
      for (let i in this.alarms) {
        let action = new SnsAction(props.alarmsTopic);
        this.alarms[i].addAlarmAction(action);
      }
    }
  }
}
