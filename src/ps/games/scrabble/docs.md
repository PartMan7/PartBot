Points to note:

- Blanks are represented as `_` in string form (eg: while in bag or rack)
  or as an object with `isBlank` in the BoardTile data type
- When played via command, all three of the following parse the `C` as a blank.
  - `AB[C]D`
  - `AB(C)D`
  - `ABC'D` (can use `‘`, `` ` ``, or `’` instead)
