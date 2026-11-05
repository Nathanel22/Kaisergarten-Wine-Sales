export type TabletId = 'TABLET-01' | 'TABLET-02' | 'TABLET-03';

export interface Fair {
  readonly id: string;
  readonly name: string;
  readonly status: 'planned' | 'active' | 'closed';
}

export interface FairAssignment {
  readonly fairId: Fair['id'];
  readonly booth: string;
}

export interface FairConfiguration {
  readonly fairs: readonly Fair[];
  readonly tablets: Readonly<Record<TabletId, FairAssignment | null>>;
}

export interface AssignedFairContext {
  readonly tabletId: TabletId;
  readonly fairId: string;
  readonly fairName: string;
  readonly booth: string;
}

/** Demo device identity; production must obtain this from device registration. */
export const DEMO_TABLET_ID: TabletId = 'TABLET-01';

/** Independent assignments: several fairs may be active at the same time. */
export const FAIR_CONFIGURATION: FairConfiguration = {
  fairs: [
    { id: 'expovina-weinschiffe', name: 'Expovina Weinschiffe', status: 'active' },
  ],
  tablets: {
    'TABLET-01': { fairId: 'expovina-weinschiffe', booth: 'Demo-Stand 01' },
    'TABLET-02': null,
    'TABLET-03': null,
  },
};

/** No seller input: changing sellers cannot change a tablet's assignment.
 * Missing, ambiguous or inactive assignments never fall back to another fair.
 * A future checkout must persist these IDs and revalidate them on the server.
 */
export function resolveFairContext(
  configuration: FairConfiguration,
  tabletId: TabletId,
): AssignedFairContext | null {
  const assignment = configuration.tablets[tabletId];
  if (!assignment || !assignment.booth.trim()) return null;
  const matches = configuration.fairs.filter((fair) => fair.id === assignment.fairId);
  if (matches.length !== 1 || matches[0].status !== 'active') return null;

  return {
    tabletId,
    fairId: matches[0].id,
    fairName: matches[0].name,
    booth: assignment.booth,
  };
}

export function getDemoFairContext(): AssignedFairContext | null {
  return resolveFairContext(FAIR_CONFIGURATION, DEMO_TABLET_ID);
}
