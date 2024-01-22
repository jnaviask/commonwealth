import { Community, UserInstance } from '@hicommonwealth/model';
import { CommunityStakeAttributes } from '@hicommonwealth/model/build/models/community_stake';
import { ServerCommunitiesController } from '../server_communities_controller';

export type PutCommunityStakeOptions = {
  user: UserInstance;
  communityStake: Community.SetCommunityStakeParams &
    Community.SetCommunityStakeBody;
};

export type PutCommunityStakeResult = CommunityStakeAttributes;

export async function __putCommunityStake(
  this: ServerCommunitiesController,
  { communityStake }: PutCommunityStakeOptions,
): Promise<CommunityStakeAttributes> {
  const [newCommunityStake] = await this.models.CommunityStake.upsert(
    communityStake,
  );

  return newCommunityStake;
}