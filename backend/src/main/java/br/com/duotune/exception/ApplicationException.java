package br.com.duotune.exception;

public class ApplicationException extends RuntimeException {
    private final ErrorType type;

    public ApplicationException(ErrorType type) {
        this(type, null);
    }

    public ApplicationException(ErrorType type, String message) {
        super(message);
        this.type = type;
    }

    public ErrorType getType() {
        return type;
    }
}