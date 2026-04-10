import * as cdk from "aws-cdk-lib";
import { TimeZoneMateStack } from "../lib/time-zone-mate-stack";
import { infrastructureConfig } from "../lib/infrastructure-config";

const app = new cdk.App();

new TimeZoneMateStack(app, "TimeZoneMateStack", infrastructureConfig, {
  env: infrastructureConfig.buildEnvironment,
});
