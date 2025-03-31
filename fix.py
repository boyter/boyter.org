import os

def check_md_files(directory):
    broken = {}
    # Loop through all files in the directory
    for filename in os.listdir(directory):
        if filename.endswith('.md'):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                for i, line in enumerate(lines, 1):
                    # Strip leading whitespace and check if ``` exists
                    stripped = line.lstrip()
                    if '```' in line and not stripped.startswith('```'):
                        # print(f"Found non-starting ``` in {filename} at line {i}:")
                        broken[filename] = filename
    for key in broken:
        print(key)

# Set the directory to check (current directory in this case)
directory = './content/posts/'
check_md_files(directory)