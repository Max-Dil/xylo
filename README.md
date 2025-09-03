# xylo
Easy browser language.

The language is written entirely in javascript without any dependencies.

# Node js version:
https://github.com/Max-Dil/xylo-node

# Installation:
Copy the xylo.js file to your project.

After that, import runXylo from xylo.js
```javascript
import {runXylo} from "/xylo.js";
```

# Usage:
```javascript
await runXylo(`
print("Hello, world!")
`);
```

# Example:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <xylo-script>
        print('Test xylo-script')
    </xylo-script>

    <script type="module">
        import {runXylo} from "/xylo.js";

        await runXylo("print('Hello, world!')");
    </script>
</body>
</html>
```

# Documentation:
https://nesworld.ru/xylo

# Online code runner:
https://nesworld.ru/xyloonline

# Tools:
https://nesworld.ru/xylotools