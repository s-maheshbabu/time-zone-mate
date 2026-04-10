import { Environment } from "aws-cdk-lib";
import * as rawConfig from "../infrastructure-config.json";

export interface InfrastructureConfig {
  readonly devoBranch: string;
  readonly prodBranch: string;
  readonly domainName: string;
  readonly buildEnvironment: Environment;
}

export const infrastructureConfig: InfrastructureConfig = {
  devoBranch: rawConfig.devoBranch,
  prodBranch: rawConfig.prodBranch,
  domainName: rawConfig.domainName,
  buildEnvironment: {
    account: rawConfig.buildEnvironment.account,
    region: rawConfig.buildEnvironment.region,
  },
};
