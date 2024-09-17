#!/bin/bash

# Define the components directory
COMPONENTS_DIR="./components"
OUTPUT_FILE="./merged.js"

# Create or clear the output file
> $OUTPUT_FILE

# Iterate over each subdirectory in the components directory
for DIR in $COMPONENTS_DIR/*; do
  if [ -d "$DIR" ]; then
    # Check if index.tsx exists in the subdirectory
    if [ -f "$DIR/index.tsx" ]; then
      echo "Merging $DIR/index.tsx"
      echo -e "\n// Contents of $DIR/index.tsx\n" >> $OUTPUT_FILE
      cat "$DIR/index.tsx" >> $OUTPUT_FILE
    fi
  fi
done

echo "Merging completed. All files are combined into $OUTPUT_FILE."
