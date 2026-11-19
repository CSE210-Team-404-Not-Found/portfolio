// reads someone's public records straight from their pds
// anyone can read these so no sign in needed
// reference: https://docs.bsky.app/docs/api/com-atproto-repo-list-records

export type PublicRecord<T> = {
  uri: string;
  cid: string;
  value: T;
};

type ListRecordsResponse<T> = {
  records: PublicRecord<T>[];
  cursor?: string;
};

// gets every record in a collection like all of someone's projects
export async function listRecords<T>(
  pdsUrl: string,
  did: string,
  collection: string,
): Promise<PublicRecord<T>[]> {
  const records: PublicRecord<T>[] = [];
  let cursor: string | undefined;

  // the pds sends back at most 100 at a time and gives a cursor if there are more
  do {
    const params = new URLSearchParams({ repo: did, collection, limit: "100" });
    if (cursor) params.set("cursor", cursor);

    const response = await fetch(
      `${pdsUrl}/xrpc/com.atproto.repo.listRecords?${params}`,
    );
    if (!response.ok)
      throw new Error(`Couldn't list ${collection} (${response.status})`);

    const page: ListRecordsResponse<T> = await response.json();
    records.push(...page.records);
    cursor = page.cursor;
  } while (cursor);

  return records;
}

// gets one record like someone's portfolio profile which is always at rkey "self"
// gives back null when they haven't made one yet
export async function getRecord<T>(
  pdsUrl: string,
  did: string,
  collection: string,
  rkey: string,
): Promise<PublicRecord<T> | null> {
  const params = new URLSearchParams({ repo: did, collection, rkey });
  const response = await fetch(
    `${pdsUrl}/xrpc/com.atproto.repo.getRecord?${params}`,
  );

  // the pds sends a 400 when the record doesn't exist
  if (response.status === 400) return null;
  if (!response.ok)
    throw new Error(`Couldn't get ${collection}/${rkey} (${response.status})`);

  return response.json();
}
