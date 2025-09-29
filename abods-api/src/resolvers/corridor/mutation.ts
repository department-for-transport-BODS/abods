import {
  isCorridorMappedToUserOrg,
  updateCorridorDb,
  deleteCorridorStops,
  deleteCorridorDb,
  insertCorridorStops,
} from "../../lib/corridor";
import {
  MutationResolvers,
  MutationResponseType,
  Resolvers,
} from "../../types/generated";
import { requireUserSession } from "../helpers";

export const createCorridor: MutationResolvers["createCorridor"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  const user = await requireUserSession(context);
  if (!args.payload?.name || !args.payload.stopIds) throw "Bad Request";

  const orgIds = user.orgs.map((org) => org.id).sort();

  const corridor = await context.db.corridor.create({
    data: {
      corridor_name: args.payload.name,
      // Not good. Should be changed later
      // This won't be visible to any other orgs they are assigned to.
      // Visibility will be somewhat random, though consistent because we sort the org numbers
      organisation_id: orgIds[0],
      user_id: user.id,
    },
    select: {
      corridor_id: true,
    },
  });

  await insertCorridorStops(
    corridor.corridor_id,
    args.payload.stopIds.map(String),
    context.db,
  );

  return {
    success: true,
  };
};

export const updateCorridor: MutationResolvers["updateCorridor"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  if (!args.inputs) throw "Bad Request";
  const user = await requireUserSession(context);
  if (
    !(await isCorridorMappedToUserOrg(Number(args.inputs.id), user, context.db))
  ) {
    throw "Not Authorized";
  }

  if (!args.inputs.id || !args.inputs.name || !args.inputs.stopList)
    throw "Bad Request";

  await Promise.all([
    updateCorridorDb(args.inputs.id, args.inputs.name, context.db),
    deleteCorridorStops(args.inputs.id, context.db),
  ]);

  await insertCorridorStops(
    args.inputs.id,
    args.inputs.stopList.map(String),
    context.db,
  );

  return {
    success: true,
  };
};

export const deleteCorridor: MutationResolvers["deleteCorridor"] = async (
  _,
  args,
  context,
): Promise<MutationResponseType> => {
  const user = await requireUserSession(context);
  if (
    !(await isCorridorMappedToUserOrg(
      Number(args.corridorId),
      user,
      context.db,
    ))
  ) {
    throw "Not Authorized";
  }

  if (!args.corridorId) throw "Bad Request";

  await Promise.all([
    deleteCorridorDb(args.corridorId, context.db),
    deleteCorridorStops(args.corridorId, context.db),
  ]);

  return {
    success: true,
  };
};

const corridorMutations: Resolvers = {
  Mutation: {
    createCorridor: createCorridor,
    updateCorridor: updateCorridor,
    deleteCorridor: deleteCorridor,
  },
};

export default corridorMutations;
