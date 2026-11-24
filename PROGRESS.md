# Progress

Public AI chat branch `cursor/public-ai-launch-8a16`.

Head: recorded by the commit that stops logout from assigning guest chats to the previous account.

r6 head `58d31798` is no longer current. A leftover thread after a 401 is not shown or uploaded for the next login. A failed delete stays hidden. Logout does not stamp guest chats with the previous account, and a failed chat fetch still hides the previous account's threads.
