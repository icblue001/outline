// @flow
import {
  User,
  Team,
  UserAuthentication,
  AuthenticationProvider,
} from "../models";
import { flushdb } from "../test/support";
import script from "./20210226232041-migrate-authentication";

beforeEach(() => flushdb());

describe("#work", () => {
  it("should create authentication record for users", async () => {
    const team = await Team.create({
      name: `Test`,
      slackId: "T123",
    });
    const user = await User.create({
      email: `test@example.com`,
      name: `Test`,
      serviceId: "U123",
      teamId: team.id,
    });

    await script();

    const authProvider = await AuthenticationProvider.findOne({
      where: {
        providerId: "T123",
      },
    });

    const auth = await UserAuthentication.findOne({
      where: {
        providerId: "U123",
      },
    });
    expect(authProvider.name).toEqual("slack");
    expect(auth.userId).toEqual(user.id);
  });

  it("should create authentication record for deleted users", async () => {
    const team = await Team.create({
      name: `Test`,
      googleId: "T456",
    });
    const user = await User.create({
      email: `test1@example.com`,
      name: `Test`,
      serviceId: "U456",
      teamId: team.id,
      deletedAt: new Date(),
    });

    await script();

    const authProvider = await AuthenticationProvider.findOne({
      where: {
        providerId: "T456",
      },
    });

    const auth = await UserAuthentication.findOne({
      where: {
        providerId: "U456",
      },
    });
    expect(authProvider.name).toEqual("google");
    expect(auth.userId).toEqual(user.id);
  });

  it("should skip invited users", async () => {
    const team = await Team.create({
      name: `Test`,
      slackId: "T789",
    });
    await User.create({
      email: `test2@example.com`,
      name: `Test`,
      teamId: team.id,
    });

    await script();

    const count = await UserAuthentication.count();
    expect(count).toEqual(0);
  });
});
